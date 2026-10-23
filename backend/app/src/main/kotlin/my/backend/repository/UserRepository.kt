package my.backend.repository

import my.backend.db.schema.UserTable
import org.jetbrains.exposed.sql.ResultRow
import org.jetbrains.exposed.sql.insert
import org.jetbrains.exposed.sql.selectAll
import org.jetbrains.exposed.sql.transactions.experimental.newSuspendedTransaction
import org.jetbrains.exposed.sql.update

data class User(
    val id: Int,
    val username: String,
    val passwordHash: String,
)

interface UserRepository {
    suspend fun findByUsername(username: String): User?

    suspend fun count(): Long

    suspend fun create(
        username: String,
        passwordHash: String,
    ): User

    suspend fun updatePasswordHash(
        username: String,
        passwordHash: String,
    ): Boolean
}

class UserRepositoryImpl : UserRepository {
    override suspend fun findByUsername(username: String): User? =
        newSuspendedTransaction {
            UserTable.selectAll().where { UserTable.username eq username }
                .singleOrNull()
                ?.let { toUser(it) }
        }

    override suspend fun count(): Long =
        newSuspendedTransaction {
            UserTable.selectAll().count()
        }

    override suspend fun create(
        username: String,
        passwordHash: String,
    ): User =
        newSuspendedTransaction {
            val id =
                UserTable.insert {
                    it[UserTable.username] = username
                    it[UserTable.password] = passwordHash
                } get UserTable.id

            User(id, username, passwordHash)
        }

    override suspend fun updatePasswordHash(
        username: String,
        passwordHash: String,
    ): Boolean =
        newSuspendedTransaction {
            UserTable.update({ UserTable.username eq username }) {
                it[UserTable.password] = passwordHash
            } > 0
        }

    private fun toUser(row: ResultRow): User {
        return User(
            id = row[UserTable.id],
            username = row[UserTable.username],
            passwordHash = row[UserTable.password],
        )
    }
}
