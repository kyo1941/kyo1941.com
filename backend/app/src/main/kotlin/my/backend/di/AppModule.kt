package my.backend.di

import com.resend.Resend
import com.zaxxer.hikari.HikariConfig
import com.zaxxer.hikari.HikariDataSource
import io.ktor.client.*
import io.ktor.client.engine.cio.*
import io.ktor.client.plugins.contentnegotiation.*
import io.ktor.serialization.kotlinx.json.*
import io.ktor.server.config.*
import kotlinx.serialization.json.Json
import my.backend.db.DatabaseFactory
import my.backend.repository.BlogRepository
import my.backend.repository.BlogRepositoryImpl
import my.backend.repository.PortfolioRepository
import my.backend.repository.PortfolioRepositoryImpl
import my.backend.repository.TagRepository
import my.backend.repository.TagRepositoryImpl
import my.backend.repository.UserRepository
import my.backend.repository.UserRepositoryImpl
import my.backend.service.AdminAccountService
import my.backend.service.AuthService
import my.backend.service.BlogService
import my.backend.service.ContactService
import my.backend.service.OgpService
import my.backend.service.PortfolioService
import my.backend.service.TagService
import org.koin.core.qualifier.named
import org.koin.dsl.module
import org.koin.dsl.onClose

fun appModule(config: ApplicationConfig) =
    module {
        // 本番用DB設定
        single {
            HikariConfig().apply {
                driverClassName = config.property("storage.driverClassName").getString()
                jdbcUrl = config.property("storage.jdbcURL").getString()
                username = config.property("storage.user").getString()
                password = config.property("storage.password").getString()
                maximumPoolSize = config.property("storage.maxPoolSize").getString().toInt()
                isAutoCommit = false
                transactionIsolation = "TRANSACTION_REPEATABLE_READ"
                validate()
            }
        }

        // HikariDataSource
        single { HikariDataSource(get()) } onClose { it?.close() }

        // DatabaseFactory
        single { DatabaseFactory(get<HikariDataSource>()) }

        // Config
        single { config }

        // HttpClient (Turnstile API用)
        single {
            HttpClient(CIO) { install(ContentNegotiation) { json(Json { ignoreUnknownKeys = true }) } }
        } onClose { it?.close() }

        // HttpClient (OGP取得用, ContentNegotiation なし)
        // OGP取得は HTML を生テキストとして読むだけであり、JSON API 呼び出しとは用途が異なるため専用クライアントを使う
        single(named("ogp")) {
            HttpClient(CIO)
        } onClose { it?.close() }

        // Resend (メール送信用)
        single { Resend(config.property("app.resend.api-key").getString()) }

        // Repositories
        single<BlogRepository> { BlogRepositoryImpl() }
        single<UserRepository> { UserRepositoryImpl() }
        single<PortfolioRepository> { PortfolioRepositoryImpl() }
        single<TagRepository> { TagRepositoryImpl() }

        // Services
        single { BlogService(get()) }
        single { ContactService(get(), get(), get()) }
        single { OgpService(get(named("ogp"))) }
        single { PortfolioService(get()) }
        single { AuthService(get(), get()) }
        single { AdminAccountService(get(), get()) }
        single { TagService(get()) }
    }
