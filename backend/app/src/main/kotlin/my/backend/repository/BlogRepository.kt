package my.backend.repository

import my.backend.db.schema.BlogTable
import my.backend.db.schema.BlogTagsTable
import my.backend.db.schema.TagTable
import my.backend.dto.BlogDetailDto
import my.backend.dto.BlogRequestDto
import my.backend.dto.BlogSummaryDto
import my.backend.util.DateParser
import my.backend.util.SlugGenerator
import org.jetbrains.exposed.sql.*
import org.jetbrains.exposed.sql.SqlExpressionBuilder.eq
import org.jetbrains.exposed.sql.transactions.experimental.newSuspendedTransaction

interface BlogRepository {
    suspend fun findAll(
        limit: Int? = null,
        tags: List<String>? = null,
        keyword: String? = null,
        includeDrafts: Boolean = false,
    ): List<BlogSummaryDto>

    suspend fun findBySlug(slug: String): BlogDetailDto?

    suspend fun create(blog: BlogRequestDto): BlogDetailDto

    suspend fun update(
        slug: String,
        blog: BlogRequestDto,
    ): BlogDetailDto?

    suspend fun delete(slug: String): Boolean
}

class BlogRepositoryImpl : BlogRepository {
    override suspend fun findAll(
        limit: Int?,
        tags: List<String>?,
        keyword: String?,
        includeDrafts: Boolean,
    ): List<BlogSummaryDto> =
        newSuspendedTransaction {
            val query =
                BlogTable.select(
                    BlogTable.id,
                    BlogTable.slug,
                    BlogTable.title,
                    BlogTable.description,
                    BlogTable.date,
                    BlogTable.isDraft,
                )

            if (!includeDrafts) {
                query.andWhere { BlogTable.isDraft eq false }
            }

            if (!tags.isNullOrEmpty()) {
                val blogIdsWithTags =
                    (BlogTagsTable innerJoin TagTable)
                        .selectAll().where { TagTable.name inList tags }
                        .map { it[BlogTagsTable.blogId] }

                query.andWhere { BlogTable.id inList blogIdsWithTags }
            }

            if (!keyword.isNullOrBlank()) {
                val escapedKeyword = escapeLikePattern(keyword)
                query.andWhere {
                    (BlogTable.title like "%$escapedKeyword%") or (BlogTable.description like "%$escapedKeyword%")
                }
            }

            query.orderBy(BlogTable.date to SortOrder.DESC)

            val resultQuery = if (limit != null) query.limit(limit) else query
            val resultRows = resultQuery.toList()

            if (resultRows.isEmpty()) return@newSuspendedTransaction emptyList()

            val blogIds = resultRows.map { it[BlogTable.id] }
            val tagsMap =
                (BlogTagsTable innerJoin TagTable)
                    .selectAll()
                    .where { BlogTagsTable.blogId inList blogIds }
                    .groupBy { it[BlogTagsTable.blogId] }
                    .mapValues { entry -> entry.value.map { it[TagTable.name] } }

            resultRows.map { toBlogSummaryDto(it, tagsMap[it[BlogTable.id]] ?: emptyList()) }
        }

    override suspend fun findBySlug(slug: String): BlogDetailDto? =
        newSuspendedTransaction {
            val row =
                BlogTable.selectAll().where { BlogTable.slug eq slug }
                    .singleOrNull() ?: return@newSuspendedTransaction null

            val blogId = row[BlogTable.id]
            val tags =
                (BlogTagsTable innerJoin TagTable)
                    .selectAll().where { BlogTagsTable.blogId eq blogId }
                    .map { it[TagTable.name] }

            toBlogDetailDto(row, tags)
        }

    override suspend fun create(blog: BlogRequestDto): BlogDetailDto =
        newSuspendedTransaction {
            val newSlug = SlugGenerator.generate()
            val blogId =
                BlogTable.insert {
                    it[slug] = newSlug
                    it[title] = blog.title
                    it[description] = blog.description
                    it[content] = blog.content
                    it[date] = DateParser.parseDateToLocalDateTime(blog.date)
                    it[isDraft] = blog.isDraft
                } get BlogTable.id

            updateTags(blogId, blog.tags)

            BlogDetailDto.fromRequestDto(blog, newSlug)
        }

    override suspend fun update(
        slug: String,
        blog: BlogRequestDto,
    ): BlogDetailDto? =
        newSuspendedTransaction {
            val existing =
                BlogTable.selectAll().where { BlogTable.slug eq slug }
                    .singleOrNull() ?: return@newSuspendedTransaction null
            val id = existing[BlogTable.id]

            BlogTable.update({ BlogTable.id eq id }) {
                it[title] = blog.title
                it[description] = blog.description
                it[content] = blog.content
                it[date] = DateParser.parseDateToLocalDateTime(blog.date)
                it[isDraft] = blog.isDraft
            }

            updateTags(id, blog.tags)

            BlogDetailDto.fromRequestDto(blog, slug)
        }

    override suspend fun delete(slug: String): Boolean =
        newSuspendedTransaction {
            val existing =
                BlogTable.selectAll().where { BlogTable.slug eq slug }
                    .singleOrNull() ?: return@newSuspendedTransaction false
            val id = existing[BlogTable.id]

            BlogTagsTable.deleteWhere { blogId eq id }

            BlogTable.deleteWhere { BlogTable.id eq id } > 0
        }

    private fun toBlogSummaryDto(
        row: ResultRow,
        tags: List<String>,
    ): BlogSummaryDto {
        return BlogSummaryDto(
            slug = row[BlogTable.slug],
            title = row[BlogTable.title],
            date = row[BlogTable.date].format(DateParser.dateFormatter),
            description = row[BlogTable.description],
            tags = tags,
            isDraft = row[BlogTable.isDraft],
        )
    }

    private fun toBlogDetailDto(
        row: ResultRow,
        tags: List<String>,
    ): BlogDetailDto {
        return BlogDetailDto(
            slug = row[BlogTable.slug],
            title = row[BlogTable.title],
            date = row[BlogTable.date].format(DateParser.dateFormatter),
            description = row[BlogTable.description],
            tags = tags,
            content = row[BlogTable.content],
            isDraft = row[BlogTable.isDraft],
        )
    }

    private fun updateTags(
        blogId: Int,
        tags: List<String>,
    ) {
        BlogTagsTable.deleteWhere { BlogTagsTable.blogId eq blogId }

        if (tags.isEmpty()) return

        TagTable.batchInsert(tags, ignore = true) { tagName ->
            this[TagTable.name] = tagName
        }

        val tagIds = TagTable.selectAll().where { TagTable.name inList tags }.map { it[TagTable.id] }

        BlogTagsTable.batchInsert(tagIds) { tagId ->
            this[BlogTagsTable.blogId] = blogId
            this[BlogTagsTable.tagId] = tagId
        }
    }

    private fun escapeLikePattern(keyword: String): String {
        return keyword
            .replace("\\", "\\\\")
            .replace("%", "\\%")
            .replace("_", "\\_")
    }
}
