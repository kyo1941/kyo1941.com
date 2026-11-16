package my.backend.db.schema

import org.jetbrains.exposed.sql.Table
import org.jetbrains.exposed.sql.javatime.datetime

object BlogTable : Table("blogs") {
    val id = integer("id").autoIncrement()
    val slug = varchar("slug", 255).uniqueIndex()
    val title = varchar("title", 255)
    val description = text("description")
    val content = mediumText("content")
    val date = datetime("date")
    val isDraft = bool("is_draft").default(false)

    override val primaryKey = PrimaryKey(id)
}
