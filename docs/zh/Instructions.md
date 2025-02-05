# 使用方法

请根据需要选择[桌面版](#桌面版)或[内嵌至rclone](#内嵌)或[远程服务器使用](#远程服务器)

桌面版适合不熟悉命令行的用户管理本地 rclone，内嵌适合管理本地 rclone，远程服务器使用适合管理远程服务器上的 rclone

## 桌面版

下载 [rwa-desktop](https://github.com/yuudi/rwa-desktop/releases/latest) 并选择适合的安装包，如果不知道选择哪个，选择 `rwa-windows-x64-setup.exe` 即可

## 内嵌

首先安装 [rclone](https://rclone.org/downloads/)

然后运行以下命令获取图形界面

```bash
rclone rcd --rc-web-gui --rc-web-gui-update --rc-web-fetch-url="https://s3.yuudi.dev/rwa/embed/version.json"
```

## 远程服务器

安装 rclone

```bash
curl https://rclone.org/install.sh | sudo bash
```

创建一个用户名和密码，并启动 rclone

```bash
rclone rcd --rc-user=用户名 --rc-pass=密码 --rc-addr=127.0.0.1:5572
```

使用反向代理并启用 HTTPS（重要，如不设置你的所有数据将暴露给任何人，而且 PWA 不允许使用不安全的连接）

如果你使用 Nginx，你可以使用下面的配置

```nginx
server {
    listen 443 ssl http2;
    server_name 你的域名;
    ssl_certificate 你的证书路径;
    ssl_certificate_key 你的证书密钥路径;

    location / {
        proxy_pass http://127.0.0.1:5572;

        # 如果你使用服务器管理面板，以上的配置可以由面板自动设置，你只需要添加以下内容

        if ($request_method = OPTIONS ) {
            return 200;
        }
        proxy_hide_header Access-Control-Allow-Origin;
        proxy_hide_header Access-Control-Allow-Headers;
        add_header Access-Control-Allow-Origin https://yuudi.github.io;
        add_header Access-Control-Allow-Headers "Authorization, Content-type";
    }
}
```

完成后，你可以前往 <https://yuudi.github.io/rclone-webui-angular/zh-CN/> 输入你的域名、用户名和密码来访问你的 rclone 服务

这个页面使用 PWA 技术，只有首次访问需要魔法，之后不再需要，即使断网也可以使用
