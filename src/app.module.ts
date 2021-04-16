import { Module } from '@nestjs/common'
import { GraphQLModule } from '@nestjs/graphql'
import { schema } from './schema'

@Module({
  imports: [
    GraphQLModule.forRoot({
      schema
    }),
  ],
})
export class AppModule {}
