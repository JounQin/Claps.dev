import { Controller, RequestMapping } from '@rxts/koa-router-decorators'
import { Context } from 'koa'
import { BigNumber, bignumber } from 'mathjs'

import { LoginRequired } from '../decorators'
import { Member, MemberWallet, Project } from '../entities'
import { octokitMap } from '../utils'

@Controller
@RequestMapping('/user')
export class UserController {
  @LoginRequired
  @RequestMapping('/profile')
  async profile(ctx: Context) {
    const userId = ctx.session.user.id
    const { data } = await octokitMap.get(userId).users.listEmails()
    ctx.body = {
      emails: data,
      projects: await ctx.conn.getRepository(Project).findByIds(
        (
          await ctx.conn.getRepository(Member).find({
            select: ['projectId'],
            where: {
              userId,
            },
          })
        ).map(({ projectId }) => projectId),
      ),
    }
  }

  @LoginRequired
  @RequestMapping('/assets')
  async assets(ctx: Context) {
    const userId = ctx.session.user.id
    const memberWallets = await ctx.conn.getRepository(MemberWallet).find({
      where: {
        userId,
      },
    })
    ctx.body = memberWallets.reduce<Record<string, BigNumber>>(
      (acc, { assetId, balance }) => {
        if (acc[assetId] == null) {
          acc[assetId] = bignumber(0)
        }
        acc[assetId] = acc[assetId].add(balance)
        return acc
      },
      {},
    )
  }
}
