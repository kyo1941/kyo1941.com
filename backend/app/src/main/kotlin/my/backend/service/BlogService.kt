package my.backend.service

import my.backend.dto.BlogDetailDto
import my.backend.dto.BlogRequestDto
import my.backend.dto.BlogSummaryDto
import my.backend.repository.BlogRepository
import my.backend.util.stripHtmlTags

class BlogService(private val blogRepository: BlogRepository) {
    companion object {
        const val MAX_LIMIT = 100
    }

    suspend fun getBlogs(
        limit: Int = MAX_LIMIT,
        tags: List<String>? = null,
        keyword: String? = null,
        includeDrafts: Boolean = false,
    ): List<BlogSummaryDto> {
        if (limit > MAX_LIMIT) {
            throw IllegalArgumentException("limit の最大値は $MAX_LIMIT です。")
        }
        return blogRepository.findAll(limit, tags, keyword, includeDrafts)
    }

    suspend fun getBlogBySlug(slug: String): BlogDetailDto? {
        return blogRepository.findBySlug(slug)
    }

    suspend fun createBlog(blog: BlogRequestDto): BlogDetailDto {
        return blogRepository.create(blog.sanitized())
    }

    suspend fun updateBlog(
        slug: String,
        blog: BlogRequestDto,
    ): BlogDetailDto? {
        return blogRepository.update(slug, blog.sanitized())
    }

    private fun BlogRequestDto.sanitized() =
        copy(
            title = title.stripHtmlTags(),
            description = description.stripHtmlTags(),
        )

    suspend fun deleteBlog(slug: String): Boolean {
        return blogRepository.delete(slug)
    }
}
