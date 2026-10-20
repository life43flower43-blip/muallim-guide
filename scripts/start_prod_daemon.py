#!/usr/bin/env python3
# خادم خفي بفصل كامل: double-fork + setsid — ينعزل عن مجموعة عمليات الطرفية
import os, sys, time

def daemonize():
    if os.fork() > 0:
        os._exit(0)  # الأب يخرج فوراً
    os.setsid()      # جلسة جديدة — انعزال عن مجموعة الطرفية
    if os.fork() > 0:
        os._exit(0)  # الوسطى تخرج — اليتيم يتبنىه الرمز ١
    sys.stdout.flush(); sys.stderr.flush()
    # تحويل المخارج إلى سجل الخادم
    log = open("/home/z/my-project/server.log", "ab", 0)
    os.dup2(log.fileno(), 1)
    os.dup2(log.fileno(), 2)
    devnull = os.open(os.devnull, os.O_RDONLY)
    os.dup2(devnull, 0)

daemonize()
os.chdir("/home/z/my-project")
os.execve("/usr/local/bin/bun",
          ["bun", ".next/standalone/server.js"],
          {"NODE_ENV": "production", "PORT": "3000", "HOSTNAME": "0.0.0.0",
           "PATH": "/usr/local/bin:/usr/bin:/bin:/home/z/.bun/bin", "HOME": "/home/z"})
