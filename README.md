# Miao-Yunzai v3

基于乐神版[云崽v3.0](https://gitee.com/le-niao/Yunzai-Bot) 改造
---
* 由于是独立新的仓库，【只建议新部署/部署后迁移】，不建议原Bot直接换源强更
* 使用icqq登录，防止oicq可能出现的低版本问题（如只需要此特性，可使用[Yunzai-V3](https://gitee.com/yoimiya-kokomi/Yunzai-Bot) )
* 基础功能会保持与Yunzai同步迭代更新，如只需原版Yunzai功能则无需切换

## 使用方法

> 环境准备： Windows or Linux，Node.js（ [版本至少v16以上](http://nodejs.cn/download/) ）， [Redis](https://redis.io/docs/getting-started/installation/ )

1.克隆项目

请根据网络情况选择Github安装或Gitee安装

```
# 使用 Github 
git clone https://github.com/helloTiKi/mys.git
cd mys 


# 使用Gitee
git clone https://github.com/helloTiKi/mys.git
cd mys 
```

2.安装依赖

```
 npm i
```

3.运行（首次运行按提示输入登录）

```
node app
```

## 致谢

|                           Nickname                            | Contribution      |
|:-------------------------------------------------------------:|-------------------|
|      [Yunzai v3.0](https://gitee.com/le-niao/Yunzai-Bot)      | 乐神的Yunzai-Bot V3  |
| [GardenHamster](https://github.com/GardenHamster/GenshinPray) | 模拟抽卡背景素材来源        |
|      [西风驿站](https://bbs.mihoyo.com/ys/collection/839181)      | 角色攻略图来源           |
|     [米游社友人A](https://bbs.mihoyo.com/ys/collection/428421)     | 角色突破素材图来源         |
