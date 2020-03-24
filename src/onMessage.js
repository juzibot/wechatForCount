/*
 * @Author: isboyjc
 * @Date: 2020-02-18 16:31:25
 * @LastEditors: isboyjc
 * @LastEditTime: 2020-03-01 02:16:17
 * @Description: 消息监听回调
 */
const { Message } = require("wechaty")
// node-request请求模块包
const request = require("request")
// 请求参数解码
const urlencode = require("urlencode")
// 配置文件
const config = require("./config")
const lisenRoom=require("../config.json").lisenRoom
const MESSAGES=require("../data/models/message")
const WORK=require("../data/models/workNum")
const axios=require("axios")
const FormData = require("form-data");
const fs=require("fs")
const FUNC=require("./functions")
// 机器人名字
const name = config.name
// 管理群组列表
const roomList = config.room.roomList


function inListenRoom(room){
  // return true
  for(let i=0;i<lisenRoom.length;i++){
    if(room.payload.topic.indexOf(lisenRoom[i])>-1){
      return true
    }
  }
  return false
}

// 消息监听回调
module.exports = bot => {
  return async function onMessage(msg) {
    // 判断消息来自自己，直接return
    // return 
    // console.log("=============================")
    // console.log(`msg : ${msg}`)
    if (msg.self()){
      if (await isAddRoom(msg)) {return}
      return
    } 

    // console.log("=============================")
    // console.log(`msg : ${msg}`)
    // console.log(
    //   `from: ${msg.from() ? msg.from().name() : null}: ${
    //     msg.from() ? msg.from().id : null
    //   }`
    // )
    // console.log(`to: ${msg.to()}`)
    console.log(`text: ${msg.text()}`)
    console.log(`isRoom: ${msg.room()}`)
    console.log("=============================")
    // 判断此消息类型是否为文本
    if (msg.type() == Message.Type.Text) {
      let messageOne={
        user:msg.from() ? msg.from().name() : "",
        time:new Date().Format("yyyy-MM-dd hh:mm:ss"),
        day:new Date().Format("yyyy-MM-dd"),
        message:msg.text().trim()
      }
      // await WORK.add(dataOne)
      await MESSAGES.add(messageOne)
      // 判断消息类型来自群聊
      if (msg.room()) {
        // 获取群聊
        const room = await msg.room()
        if(inListenRoom(room)){
          if (await isAddRoom(msg)) return
          console.log("关注群",room.payload.topic)
        }
        // console.log(room)
        // console.log(msg.room())
        // 收到消息，提到自己
        // if (await msg.mentionSelf()) {
        //   // 获取提到自己的名字
        //   let self = await msg.to()
        //   self = "@" + self.name()
        //   // 获取消息内容，拿到整个消息文本，去掉 @+名字
        //   let sendText = msg.text().replace(self, "")

        //   // 请求机器人接口回复
        //   // let res = await requestRobot(sendText)

        //   // 返回消息，并@来自人
        //   room.say(res, msg.from())
        //   return
        // }

        // 收到消息，没有提到自己  忽略
      } else {
        // 回复信息是关键字 “加群”
        if (await isAddRoom(msg)) return

        // 回复信息是所管理的群聊名
        // if (await isRoomName(bot, msg)) return

        // 请求机器人聊天接口
        // let res = await requestRobot(msg.text())
        // 返回聊天接口内容
        // await msg.say(res)
      }
    } else {
      console.log("消息不是文本！",msg.type())
    }
  }
}

/**
 * @description 回复信息是关键字 “加群” 处理函数
 * @param {Object} msg 消息对象
 * @return {Promise} true-是 false-不是
 */
async function isAddRoom(msg) {
  // 关键字 加群 处理
  return await FUNC.router(msg)
  return false
}

/**
 * @description 回复信息是所管理的群聊名 处理函数
 * @param {Object} bot 实例对象
 * @param {Object} msg 消息对象
 * @return {Promise} true-是群聊 false-不是群聊
 */
async function isRoomName(bot, msg) {
  // 回复信息为管理的群聊名
  if (Object.keys(roomList).some(v => v == msg.text())) {
    // 通过群聊id获取到该群聊实例
    const room = await bot.Room.find({ id: roomList[msg.text()] })

    // 判断是否在房间中 在-提示并结束
    if (await room.has(msg.from())) {
      await msg.say("您已经在房间中了")
      return true
    }

    // 发送群邀请
    await room.add(msg.from())
    await msg.say("已发送群邀请")
    return true
  }
  return false
}

/**
 * @description 机器人请求接口 处理函数
 * @param {String} info 发送文字
 * @return {Promise} 相应内容
 */
function requestRobot(info) {
  return new Promise((resolve, reject) => {
    let url = `https://open.drea.cc/bbsapi/chat/get?keyWord=${urlencode(info)}`
    request(url, (error, response, body) => {
      if (!error && response.statusCode == 200) {
        let res = JSON.parse(body)
        if (res.isSuccess) {
          let send = res.data.reply
          // 免费的接口，所以需要把机器人名字替换成为自己设置的机器人名字
          send = send.replace(/Smile/g, name)
          resolve(send)
        } else {
          if (res.code == 1010) {
            resolve("没事别老艾特我，我还以为爱情来了")
          } else {
            resolve("你在说什么，我听不懂")
          }
        }
      } else {
        resolve("你在说什么，我脑子有点短路诶！")
      }
    })
  })
}
