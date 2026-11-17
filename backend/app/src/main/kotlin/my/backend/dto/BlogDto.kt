package my.backend.dto

import kotlinx.serialization.Serializable

/**
 * ブログ記事作成・更新時のリクエストボディを表すDTO
 * スラッグはサーバー側で生成またはURLパスから取得するため、このDTOには含まれない
 *
 * @property title 記事のタイトル
 * @property date 記事の公開日
 * @property description 記事の概要
 * @property tags 記事に関連付けられたタグのリスト
 * @property content 記事の本文
 */
@Serializable
data class BlogRequestDto(
    val title: String,
    val date: String,
    val description: String,
    val tags: List<String>,
    val content: String,
    val isDraft: Boolean = false,
)

/**
 * ブログ記事一覧の1件を表すDTO
 * 一覧では本文を使わず、記事ごとの本文まで返すと応答が記事の長さに比例して大きくなるため、本文を含めない
 */
@Serializable
data class BlogSummaryDto(
    val slug: String,
    val title: String,
    val date: String,
    val description: String,
    val tags: List<String>,
    val isDraft: Boolean = false,
)

/**
 * ブログ記事情報のレスポンスを表すDTO
 * クライアントへの返却に必要な全ての情報を含む
 *
 * @property slug 記事を一意に識別するスラッグ（ID）
 * @property title 記事のタイトル
 * @property date 記事の公開日
 * @property description 記事の概要
 * @property tags 記事に関連付けられたタグのリスト
 * @property content 記事の本文
 */
@Serializable
data class BlogResponseDto(
    val slug: String,
    val title: String,
    val date: String,
    val description: String,
    val tags: List<String>,
    val content: String,
    val isDraft: Boolean = false,
) {
    companion object {
        fun fromRequestDto(
            request: BlogRequestDto,
            slug: String,
        ): BlogResponseDto {
            return BlogResponseDto(
                slug = slug,
                title = request.title,
                date = request.date,
                description = request.description,
                tags = request.tags,
                content = request.content,
                isDraft = request.isDraft,
            )
        }
    }
}
