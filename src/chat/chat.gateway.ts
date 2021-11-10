import {
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets'
import { Socket } from 'socket.io'
import { Logger } from '@nestjs/common'
import { omit } from 'lodash'

type OrderTable = {
  total: number
  users: {
    [key: string]: {
      products: { [key: number]: OrderProduct }
      promotions: { [key: number]: OrderPromotion }
    }
  }
  detail: {
    products: { [key: number]: OrderProduct }
    promotions: { [key: number]: OrderPromotion }
  }
}

type OrderProduct = {
  id: number
  name: string
  price: number
  quantity: number
}

type RoomProduct = {
  room: Room
} & OrderProduct

type OrderPromotion = {
  id: number
  name: string
  price: number
  quantity: number
}

type RoomPromotion = {
  room: Room
} & OrderPromotion

type Room = {
  id: string
  name: string
}

@WebSocketGateway({ namespace: '/chat', cors: true })
export class ChatGateway {
  @WebSocketServer() wss

  private logger: Logger = new Logger('ChatGateway')

  afterInit(server: any) {
    this.logger.log('Initialized!')
  }

  private tableClients: Map<String, OrderTable> = new Map()

  @SubscribeMessage('addProduct')
  handleAddProduct(client: Socket, message: RoomProduct) {
    const room = message.room
    const table = this.tableClients.get(room.id)
    delete message.room

    const productDetail = table.detail.products[message.id]
    if (productDetail === undefined)
      table.detail.products[message.id] = {
        ...message,
        quantity: 1,
      }
    else
      table.detail.products[productDetail.id] = {
        ...productDetail,
        quantity: ++productDetail.quantity,
      }

    const productUser = table.users[room.name].products[message.id]
    if (productUser === undefined)
      table.users[room.name].products[message.id] = {
        ...message,
        quantity: 1,
      }
    else
      table.users[room.name].products[productUser.id] = {
        ...productUser,
        quantity: ++productUser.quantity,
      }

    table.total += table.detail.products[message.id].price

    // clean empty users
    const data = {
      ...this.tableClients.get(room.id),
      users: this.cleanEmptyUsers(this.tableClients.get(room.id).users),
    }

    this.wss.to(room.id).emit('productAdded', data)
  }

  @SubscribeMessage('removeProduct')
  handleRemoveProduct(client: Socket, message: RoomProduct) {
    const room = message.room
    const table = this.tableClients.get(room.id)
    delete message.room

    const productDetail = table.detail.products[message.id]
    table.detail.products[productDetail.id] = {
      ...productDetail,
      quantity: --productDetail.quantity,
    }

    const productUser = table.users[room.name].products[message.id]
    if (productUser !== undefined) {
      table.users[room.name].products[productUser.id] = {
        ...productUser,
        quantity: --productUser.quantity,
      }
      if (table.users[room.name].products[productUser.id].quantity === 0)
        delete table.users[room.name].products[productUser.id]
    }

    table.total -= table.detail.products[productDetail.id].price

    if (table.detail.products[productDetail.id].quantity === 0)
      delete table.detail.products[productDetail.id]

    // clean empty users
    const data = {
      ...this.tableClients.get(room.id),
      users: this.cleanEmptyUsers(this.tableClients.get(room.id).users),
    }

    this.wss.to(room.id).emit('productRemoved', data)
  }

  @SubscribeMessage('addPromotion')
  handleAddPromotion(client: Socket, message: RoomPromotion) {
    const room = message.room
    const table = this.tableClients.get(room.id)
    delete message.room

    const promotionDetail = table.detail.promotions[message.id]
    if (promotionDetail === undefined)
      table.detail.promotions[message.id] = {
        ...message,
        quantity: 1,
      }
    else
      table.detail.promotions[promotionDetail.id] = {
        ...promotionDetail,
        quantity: ++promotionDetail.quantity,
      }

    const promotionUser = table.users[room.name].promotions[message.id]
    if (promotionUser === undefined)
      table.users[room.name].promotions[message.id] = {
        ...message,
        quantity: 1,
      }
    else
      table.users[room.name].promotions[promotionUser.id] = {
        ...promotionUser,
        quantity: ++promotionUser.quantity,
      }

    table.total += table.detail.promotions[message.id].price

    // clean empty users
    const data = {
      ...this.tableClients.get(room.id),
      users: this.cleanEmptyUsers(this.tableClients.get(room.id).users),
    }

    this.wss.to(room.id).emit('promotionAdded', data)
  }

  @SubscribeMessage('removePromotion')
  handleRemovePromotion(client: Socket, message: RoomPromotion) {
    const room = message.room
    const table = this.tableClients.get(room.id)
    delete message.room

    const promotionDetail = table.detail.promotions[message.id]
    table.detail.promotions[promotionDetail.id] = {
      ...promotionDetail,
      quantity: --promotionDetail.quantity,
    }

    const promotionUser = table.users[room.name].promotions[message.id]
    if (promotionUser !== undefined) {
      table.users[room.name].promotions[promotionUser.id] = {
        ...promotionUser,
        quantity: --promotionUser.quantity,
      }
      if (table.users[room.name].promotions[promotionUser.id].quantity === 0)
        delete table.users[room.name].promotions[promotionUser.id]
    }

    table.total -= table.detail.promotions[promotionDetail.id].price

    if (table.detail.promotions[promotionDetail.id].quantity === 0)
      delete table.detail.promotions[promotionDetail.id]

    // clean empty users
    const data = {
      ...this.tableClients.get(room.id),
      users: this.cleanEmptyUsers(this.tableClients.get(room.id).users),
    }

    this.wss.to(room.id).emit('promotionRemoved', data)
  }

  @SubscribeMessage('joinTable')
  handleTableJoin(client: Socket, room: Room) {
    client.join(room.id)
    if (!this.tableClients.has(room.id))
      this.tableClients.set(room.id, {
        total: 0,
        users: {},
        detail: {
          products: {},
          promotions: {},
        },
      })

    if (this.tableClients.get(room.id).users[room.name] === undefined)
      this.tableClients.get(room.id).users[room.name] = {
        products: {},
        promotions: {},
      }

    // clean empty users
    const data = {
      ...this.tableClients.get(room.id),
      users: omit(
        this.cleanEmptyUsers(this.tableClients.get(room.id).users),
        room.name
      ),
      myOrder: this.tableClients.get(room.id).users[room.name],
    }

    client.emit('joinedTable', data)
  }

  cleanEmptyUsers(users: {
    [key: string]: {
      products: { [key: number]: OrderProduct }
      promotions: { [key: number]: OrderPromotion }
    }
  }): {
    [key: string]: {
      products: { [key: number]: OrderProduct }
      promotions: { [key: number]: OrderPromotion }
    }
  } {
    const usersResults = {}
    Object.entries(users).forEach(([key, value]) => {
      if (
        Object.keys(value.products).length !== 0 ||
        Object.keys(value.promotions).length !== 0
      )
        usersResults[key] = value
    })
    return usersResults
  }
}
