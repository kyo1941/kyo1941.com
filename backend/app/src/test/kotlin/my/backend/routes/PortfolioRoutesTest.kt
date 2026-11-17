package my.backend.routes

import io.ktor.client.request.*
import io.ktor.client.statement.*
import io.ktor.http.*
import my.backend.db.schema.PortfolioTable
import my.backend.testutil.testApplicationWithH2
import org.jetbrains.exposed.sql.SqlExpressionBuilder.eq
import org.jetbrains.exposed.sql.deleteWhere
import org.jetbrains.exposed.sql.insert
import org.jetbrains.exposed.sql.transactions.transaction
import java.time.LocalDateTime
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFalse
import kotlin.test.assertTrue

class PortfolioRoutesTest {
    @Test
    fun `ポートフォリオ一覧を取得できる`() =
        testApplicationWithH2 {
            client.get("/api/portfolios").apply {
                assertEquals(HttpStatusCode.OK, status)
                assertTrue(bodyAsText().contains("["))
            }
        }

    @Test
    fun `ポートフォリオ一覧には本文を含めない`() =
        testApplicationWithH2 {
            startApplication()
            val slug = "list-without-content"
            transaction {
                PortfolioTable.insert {
                    it[PortfolioTable.slug] = slug
                    it[title] = "タイトル"
                    it[description] = "概要"
                    it[content] = "本文"
                    it[date] = LocalDateTime.now()
                }
            }
            try {
                client.get("/api/portfolios").apply {
                    assertEquals(HttpStatusCode.OK, status)
                    val body = bodyAsText()
                    assertTrue(body.contains(slug))
                    assertFalse(body.contains("\"content\""))
                }
            } finally {
                transaction { PortfolioTable.deleteWhere { PortfolioTable.slug eq slug } }
            }
        }

    @Test
    fun `存在しないスラッグのポートフォリオは404を返す`() =
        testApplicationWithH2 {
            client.get("/api/portfolios/non-existent-portfolio").apply {
                assertEquals(HttpStatusCode.NotFound, status)
            }
        }
}
