# [NPM] Private Package Manager

强大的npm私有源仓库程序。

```bash
$ npm ci # 安装依赖
$ npm run dev # 启动开发调试
$ npm run start # 生产环境启动
```

## Command Support

目前支持以下的命令: (cpm 泛指 私有源命令行工具)

- [x] `cpm adduser [--scope=@orgname] [--auth-type=legacy]` 登录或者添加用户或者修改用户(aliases: `login`, `add-user`)
- [x] `cpm install [<@scope>/]<name>[@<tag>|<version>|<version range>]` 安装模块
- [x] `cpm uninstall [<@scope>/]<pkg>[@<version>]... [-S|--save|-D|--save-dev|-O|--save-optional|--no-save]` 卸载模块
- [x] `cpm update [-g] [<pkg>...]` 更新模块
- [x] `cpm publish [<tarball>|<folder>] [--tag <tag>]` 发布模块
- [x] `cpm unpublish [<@scope>/]<pkg>[@<version>]` 删除模块
- [x] `cpm whoami` 查看当前用户
- [x] `cpm owner add <user> [<@scope>/]<pkg>` 添加贡献者
- [x] `cpm owner rm <user> [<@scope>/]<pkg>` 删除贡献者
- [x] `cpm owner ls [<@scope>/]<pkg>` 查看贡献者
- [x] `cpm deprecate <pkg>[@<version>] <message>` 废弃版本
- [x] `cpm view [<@scope>/]<name>[@<version>]` 查看包信息
- [x] `cpm dist-tag add <pkg>@<version> [<tag>]` 添加dist-tag
- [x] `cpm dist-tag rm <pkg> <tag>` 删除dist-tag
- [x] `cpm dist-tag ls [<pkg>]` 查看所有dist-tags
- [ ] `cpm access public [<package>]` 未知
- [ ] `cpm access restricted [<package>]` 未知

## Use NPC

[NPC](https://github.com/flowxjs/npm-cli) 主要用来辅助开发的工具，它具备NPM所有功能，但也包含对本程序的额外处理功能（初始化等）。

```bash
$ npm i -g @flowx/npm-cli
$ npc r
# type the registry url and select yes to confirm
$ npc setup
# test:
$ npc view react
```

## Ecology

- [x] [npm-cli](https://github.com/flowxjs/npm-cli) 辅助的命令行工具
- [x] [npm-template](https://github.com/flowxjs/npm-template) 快速安装的模板
- [ ] [npm-web](https://github.com/flowxjs/npm-web) 主题

## Setup

首先克隆快速安装模板

```bash
$ git clone git@github.com:flowxjs/npm-template.git
$ cd npm-template
$ rm -rf .git
```

你需要修改项目下面的`npm.config.json`来配置数据库和redis。修改完毕后将程序上传至你的服务器，通过以下命令启动

```bash
$ npm start
```

然后在你的本地电脑上通过辅助工具安装初始化：

```bash
$ npm i -g @flowx/npm-cli
$ npc r # 输入你的服务域名地址
$ npc setup # 按照流程进行
```

最后验证是否安装成功

```bash
$ npc view react
```