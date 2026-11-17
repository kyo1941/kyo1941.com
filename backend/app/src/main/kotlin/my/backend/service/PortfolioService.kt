package my.backend.service

import my.backend.dto.PortfolioDetailDto
import my.backend.dto.PortfolioRequestDto
import my.backend.dto.PortfolioSummaryDto
import my.backend.repository.PortfolioRepository
import my.backend.util.stripHtmlTags

class PortfolioService(private val portfolioRepository: PortfolioRepository) {
    companion object {
        const val MAX_LIMIT = 100
    }

    suspend fun getPortfolios(
        limit: Int = MAX_LIMIT,
        includeDrafts: Boolean = false,
    ): List<PortfolioSummaryDto> {
        if (limit > MAX_LIMIT) {
            throw IllegalArgumentException("limit の最大値は $MAX_LIMIT です。")
        }
        return portfolioRepository.findAll(limit, includeDrafts)
    }

    suspend fun getPortfolioBySlug(slug: String): PortfolioDetailDto? {
        return portfolioRepository.findBySlug(slug)
    }

    suspend fun createPortfolio(portfolio: PortfolioRequestDto): PortfolioDetailDto {
        return portfolioRepository.create(portfolio.sanitized())
    }

    suspend fun updatePortfolio(
        slug: String,
        portfolio: PortfolioRequestDto,
    ): PortfolioDetailDto? {
        return portfolioRepository.update(slug, portfolio.sanitized())
    }

    private fun PortfolioRequestDto.sanitized() =
        copy(
            title = title.stripHtmlTags(),
            description = description.stripHtmlTags(),
        )

    suspend fun deletePortfolio(slug: String): Boolean {
        return portfolioRepository.delete(slug)
    }
}
