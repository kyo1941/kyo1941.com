package my.backend.repository

import my.backend.db.schema.PortfolioTable
import my.backend.dto.PortfolioDetailDto
import my.backend.dto.PortfolioRequestDto
import my.backend.dto.PortfolioSummaryDto
import my.backend.util.DateParser
import my.backend.util.SlugGenerator
import org.jetbrains.exposed.sql.*
import org.jetbrains.exposed.sql.SqlExpressionBuilder.eq
import org.jetbrains.exposed.sql.transactions.experimental.newSuspendedTransaction

interface PortfolioRepository {
    suspend fun findAll(
        limit: Int? = null,
        includeDrafts: Boolean = false,
    ): List<PortfolioSummaryDto>

    suspend fun findBySlug(slug: String): PortfolioDetailDto?

    suspend fun create(portfolio: PortfolioRequestDto): PortfolioDetailDto

    suspend fun update(
        slug: String,
        portfolio: PortfolioRequestDto,
    ): PortfolioDetailDto?

    suspend fun delete(slug: String): Boolean
}

class PortfolioRepositoryImpl : PortfolioRepository {
    override suspend fun findAll(
        limit: Int?,
        includeDrafts: Boolean,
    ): List<PortfolioSummaryDto> =
        newSuspendedTransaction {
            val query =
                PortfolioTable.select(
                    PortfolioTable.slug,
                    PortfolioTable.title,
                    PortfolioTable.description,
                    PortfolioTable.coverImage,
                    PortfolioTable.date,
                    PortfolioTable.isDraft,
                )

            if (!includeDrafts) {
                query.andWhere { PortfolioTable.isDraft eq false }
            }

            query.orderBy(PortfolioTable.date to SortOrder.DESC)

            val resultQuery = if (limit != null) query.limit(limit) else query
            resultQuery.map { toPortfolioSummaryDto(it) }
        }

    override suspend fun findBySlug(slug: String): PortfolioDetailDto? =
        newSuspendedTransaction {
            PortfolioTable.selectAll().where { PortfolioTable.slug eq slug }
                .singleOrNull()
                ?.let { toPortfolioDetailDto(it) }
        }

    override suspend fun create(portfolio: PortfolioRequestDto): PortfolioDetailDto =
        newSuspendedTransaction {
            val newSlug = SlugGenerator.generate()
            PortfolioTable.insert {
                it[slug] = newSlug
                it[title] = portfolio.title
                it[description] = portfolio.description
                it[content] = portfolio.content
                it[coverImage] = portfolio.coverImage
                it[date] = DateParser.parseDateToLocalDateTime(portfolio.date)
                it[isDraft] = portfolio.isDraft
            }

            PortfolioDetailDto.fromRequestDto(portfolio, newSlug)
        }

    override suspend fun update(
        slug: String,
        portfolio: PortfolioRequestDto,
    ): PortfolioDetailDto? =
        newSuspendedTransaction {
            val updatedRows =
                PortfolioTable.update({ PortfolioTable.slug eq slug }) {
                    it[title] = portfolio.title
                    it[description] = portfolio.description
                    it[content] = portfolio.content
                    it[coverImage] = portfolio.coverImage
                    it[date] = DateParser.parseDateToLocalDateTime(portfolio.date)
                    it[isDraft] = portfolio.isDraft
                }

            if (updatedRows > 0) {
                PortfolioDetailDto.fromRequestDto(portfolio, slug)
            } else {
                null
            }
        }

    override suspend fun delete(slug: String): Boolean =
        newSuspendedTransaction {
            PortfolioTable.deleteWhere { PortfolioTable.slug eq slug } > 0
        }

    private fun toPortfolioSummaryDto(row: ResultRow): PortfolioSummaryDto {
        return PortfolioSummaryDto(
            slug = row[PortfolioTable.slug],
            title = row[PortfolioTable.title],
            date = row[PortfolioTable.date].format(DateParser.dateFormatter),
            description = row[PortfolioTable.description],
            coverImage = row[PortfolioTable.coverImage],
            isDraft = row[PortfolioTable.isDraft],
        )
    }

    private fun toPortfolioDetailDto(row: ResultRow): PortfolioDetailDto {
        return PortfolioDetailDto(
            slug = row[PortfolioTable.slug],
            title = row[PortfolioTable.title],
            date = row[PortfolioTable.date].format(DateParser.dateFormatter),
            description = row[PortfolioTable.description],
            coverImage = row[PortfolioTable.coverImage],
            content = row[PortfolioTable.content],
            isDraft = row[PortfolioTable.isDraft],
        )
    }
}
