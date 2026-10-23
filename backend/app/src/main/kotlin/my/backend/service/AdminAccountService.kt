package my.backend.service

import io.ktor.server.config.*
import my.backend.repository.UserRepository
import org.mindrot.jbcrypt.BCrypt
import org.slf4j.LoggerFactory

class AdminAccountService(
    private val userRepository: UserRepository,
    private val config: ApplicationConfig,
) {
    private val logger = LoggerFactory.getLogger(javaClass)

    /**
     * 設定の管理者パスワードと DB のハッシュが一致しなければ、設定の値で上書きする。
     * 該当ユーザーがいない場合は作成しない（ユーザー名を変えたときに管理者が増えるのを避けるため）。
     */
    suspend fun syncPasswordWithConfig() {
        val username = config.propertyOrNull("app.admin.username")?.getString()?.takeIf { it.isNotBlank() } ?: return
        val password = config.propertyOrNull("app.admin.password")?.getString()?.takeIf { it.isNotBlank() } ?: return

        val admin = userRepository.findByUsername(username)
        if (admin == null) {
            logger.warn("Admin user '$username' was not found; skipped password sync")
            return
        }
        if (matches(password, admin.passwordHash)) return

        userRepository.updatePasswordHash(username, BCrypt.hashpw(password, BCrypt.gensalt()))
        logger.info("Updated password of admin user '$username' from configuration")
    }

    // jBCrypt は $2a$ 以外の形式のハッシュに例外を投げるため、照合できないものは不一致として上書き対象にする
    private fun matches(
        password: String,
        passwordHash: String,
    ): Boolean = runCatching { BCrypt.checkpw(password, passwordHash) }.getOrDefault(false)
}
