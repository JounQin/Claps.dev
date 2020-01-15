import { Controller, RequestMapping } from '@rxts/koa-router-decorators'
import axios from 'axios'
import { Context } from 'koa'
import { Mixin } from 'mixin-node-sdk'

export interface MixinOauth {
  data?: {
    access_token: string
    scope: string
  }
  error?: {
    status: number
    code: number
    description: string
  }
}

const mixin = new Mixin(
  Object.assign(JSON.parse(process.env.MIXIN_CLIENT_CONFIG), {
    client_secret: process.env.MIXIN_CLIENT_SECRET,
  }),
)

@Controller
@RequestMapping('/mixin')
export class MixinController {
  @RequestMapping('/oauth')
  async oauth(ctx: Context) {
    const { code, state } = ctx.query

    if (!state || state !== ctx.session.uid) {
      ctx.session.mixinToken = null
      return ctx.throw('invalid oauth redirect')
    }

    const {
      data: { data, error },
    } = await axios.post<MixinOauth>('https://api.mixin.one/oauth/token', {
      client_id: process.env.MIXIN_CLIENT_ID,
      client_secret: process.env.MIXIN_CLIENT_SECRET,
      code,
    })

    if (error) {
      return ctx.throw(error.description, error.code, error.status)
    }

    Object.assign(ctx.session, {
      mixinToken: data.access_token,
      mixinScope: data.scope,
    })

    ctx.redirect(decodeURIComponent(ctx.cookies.get('redirectPath')) || '/')
  }

  @RequestMapping('/assets')
  async assets(ctx: Context) {
    ctx.body = await mixin.query_assets({})
  }
}