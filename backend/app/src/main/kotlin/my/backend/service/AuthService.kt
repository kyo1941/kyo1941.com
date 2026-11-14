package my.backend.service

import com.auth0.jwt.JWT
import com.auth0.jwt.algorithms.Algorithm
import io.ktor.server.config.*
import my.backend.repository.UserRepository
import org.mindrot.jbcrypt.BCrypt
import org.slf4j.LoggerFactory
import java.time.Duration
import java.util.*

private val SESSION_DURATION = Duration.ofHours(24)

class AuthService(
    private val userRepository: UserRepository,
    private val config: ApplicationConfig,
) {
    private val logger = LoggerFactory.getLogger(javaClass)

    suspend fun authenticate(
        username: String,
        password: String,
    ): String? {
        return userRepository.findByUsername(username)
            ?.takeIf { BCrypt.checkpw(password, it.passwordHash) }
            ?.let { generateToken(it.username) }
            ?: run {
                logger.warn("Authentication failed for user: $username")
                null
            }
    }

    private fun generateToken(username: String): String {
        val secret = config.property("jwt.secret").getString()
        val issuer = config.property("jwt.issuer").getString()
        val audience = config.property("jwt.audience").getString()

        return JWT.create()
            .withAudience(audience)
            .withIssuer(issuer)
            .withClaim("username", username)
            .withExpiresAt(Date(System.currentTimeMillis() + SESSION_DURATION.toMillis()))
            .sign(Algorithm.HMAC256(secret))
    }
}
