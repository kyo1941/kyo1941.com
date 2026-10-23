package my.backend

import io.ktor.server.application.*
import io.ktor.server.netty.*
import kotlinx.coroutines.runBlocking
import my.backend.db.DatabaseFactory
import my.backend.di.appModule
import my.backend.plugins.*
import my.backend.service.AdminAccountService
import org.koin.ktor.ext.inject

fun main(args: Array<String>): Unit = EngineMain.main(args)

fun Application.module() {
    configureKoin(listOf(appModule(environment.config)))

    val databaseFactory: DatabaseFactory by inject()
    databaseFactory.init()

    val adminAccountService: AdminAccountService by inject()
    runBlocking { adminAccountService.syncPasswordWithConfig() }

    configureSerialization()
    configureHTTP()
    configureSecurity()
    configureCsrfProtection()
    configureValidation()
    configureStatusPages()
    configureRouting()
}
