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