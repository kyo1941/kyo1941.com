package my.backend.dto

import kotlinx.serialization.Serializable

/**
 * ポートフォリオ作成・更新時のリクエストボディを表すDTO
 * スラッグはサーバー側で生成またはURLパスから取得するため、このDTOには含まれない
 */
@Serializable
data class PortfolioRequestDto(
    val title: String,
    val date: String,
    val description: String,
    val coverImage: String? = null,
    val content: String,
    val isDraft: Boolean = false,
)

/**
 * ポートフォリオ一覧の1件を表すDTO
 * 一覧では本文を使わず、作品ごとの本文まで返すと応答が本文の長さに比例して大きくなるため、本文を含めない
 */
@Serializable
data class PortfolioSummaryDto(
    val slug: String,
    val title: String,
    val date: String,
    val description: String,
    val coverImage: String? = null,
    val isDraft: Boolean = false,
)

/**
 * ポートフォリオ情報のレスポンスを表すDTO
 * クライアントへの返却に必要な全ての情報を含む
 */
@Serializable
data class PortfolioResponseDto(
    val slug: String,
    val title: String,
    val date: String,
    val description: String,
    val coverImage: String? = null,
    val content: String,
    val isDraft: Boolean = false,
) {
    companion object {
        fun fromRequestDto(
            request: PortfolioRequestDto,
            slug: String,
        ): PortfolioResponseDto {
            return PortfolioResponseDto(
                slug = slug,
                title = request.title,
                date = request.date,
                description = request.description,
                coverImage = request.coverImage,
                content = request.content,
                isDraft = request.isDraft,
            )
        }
    }
}
