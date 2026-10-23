package my.backend.service

import io.ktor.server.config.*
import io.mockk.coEvery
import io.mockk.coVerify
import io.mockk.mockk
import io.mockk.slot
import kotlinx.coroutines.runBlocking
import my.backend.repository.User
import my.backend.repository.UserRepository
import org.junit.jupiter.api.Test
import org.mindrot.jbcrypt.BCrypt
import kotlin.test.assertTrue

class AdminAccountServiceTest {
    private val userRepository = mockk<UserRepository>()

    private fun configOf(vararg entries: Pair<String, String>) =
        MapApplicationConfig().apply { entries.forEach { (key, value) -> put(key, value) } }

    private val adminConfig =
        configOf(
            "app.admin.username" to "admin",
            "app.admin.password" to "new-password-0123456789",
        )

    @Test
    fun `設定のパスワードがDBのハッシュと一致すれば更新しない`() =
        runBlocking {
            coEvery { userRepository.findByUsername("admin") } returns
                User(1, "admin", BCrypt.hashpw("new-password-0123456789", BCrypt.gensalt()))

            AdminAccountService(userRepository, adminConfig).syncPasswordWithConfig()

            coVerify(exactly = 0) { userRepository.updatePasswordHash(any(), any()) }
        }

    @Test
    fun `設定のパスワードがDBのハッシュと異なれば設定の値で更新する`() =
        runBlocking {
            coEvery { userRepository.findByUsername("admin") } returns
                User(1, "admin", BCrypt.hashpw("old-password", BCrypt.gensalt()))
            val newHash = slot<String>()
            coEvery { userRepository.updatePasswordHash("admin", capture(newHash)) } returns true

            AdminAccountService(userRepository, adminConfig).syncPasswordWithConfig()

            assertTrue(BCrypt.checkpw("new-password-0123456789", newHash.captured))
        }

    @Test
    fun `DBのハッシュが照合できない形式なら設定の値で更新する`() =
        runBlocking {
            val unverifiableHash =
                BCrypt.hashpw("new-password-0123456789", BCrypt.gensalt()).replaceFirst("\$2a\$", "\$2y\$")
            coEvery { userRepository.findByUsername("admin") } returns User(1, "admin", unverifiableHash)
            val newHash = slot<String>()
            coEvery { userRepository.updatePasswordHash("admin", capture(newHash)) } returns true

            AdminAccountService(userRepository, adminConfig).syncPasswordWithConfig()

            assertTrue(BCrypt.checkpw("new-password-0123456789", newHash.captured))
        }

    @Test
    fun `設定のユーザーがDBにいなければ作成も更新もしない`() =
        runBlocking {
            coEvery { userRepository.findByUsername("admin") } returns null

            AdminAccountService(userRepository, adminConfig).syncPasswordWithConfig()

            coVerify(exactly = 0) { userRepository.updatePasswordHash(any(), any()) }
            coVerify(exactly = 0) { userRepository.create(any(), any()) }
        }

    @Test
    fun `管理者の設定がなければDBを参照しない`() =
        runBlocking {
            AdminAccountService(userRepository, configOf()).syncPasswordWithConfig()

            coVerify(exactly = 0) { userRepository.findByUsername(any()) }
        }

    @Test
    fun `設定のパスワードが16文字未満なら既存のパスワードを残す`() =
        runBlocking {
            coEvery { userRepository.findByUsername("admin") } returns
                User(1, "admin", BCrypt.hashpw("old-password-0123456789", BCrypt.gensalt()))

            AdminAccountService(
                userRepository,
                configOf("app.admin.username" to "admin", "app.admin.password" to "short-pass"),
            ).syncPasswordWithConfig()

            coVerify(exactly = 0) { userRepository.updatePasswordHash(any(), any()) }
        }

    @Test
    fun `設定のパスワードが雛形のままなら既存のパスワードを残す`() =
        runBlocking {
            coEvery { userRepository.findByUsername("admin") } returns
                User(1, "admin", BCrypt.hashpw("old-password-0123456789", BCrypt.gensalt()))

            AdminAccountService(
                userRepository,
                configOf("app.admin.username" to "admin", "app.admin.password" to "YOUR_ADMIN_PASSWORD"),
            ).syncPasswordWithConfig()

            coVerify(exactly = 0) { userRepository.updatePasswordHash(any(), any()) }
        }
}
