package app.vercel.muallim_guide.twa;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.content.Context;
import android.media.AudioAttributes;
import android.media.RingtoneManager;
import android.os.Build;

import com.google.androidbrowserhelper.trusted.DelegationService;

/**
 * يستقبل إشعارات الموقع من Chrome ويعرضها باسم التطبيق على فئة «تذكيرات تربوي»
 * بأهمية عالية (IMPORTANCE_HIGH)، فيظهر الإشعار منبثقًا أعلى الشاشة مع صوت واهتزاز
 * حتى أثناء استخدام تطبيق آخر، مثل إشعارات التطبيقات الأصلية.
 * (المكتبة الأصلية تعرضه على فئة بأهمية عادية، فلا ينبثق.)
 */
public class HighPriorityDelegationService extends DelegationService {
    static final String CHANNEL_ID = "turbawy_reminders_high";

    @Override
    public boolean onNotifyNotificationWithChannel(String platformTag, int platformId, Notification notification, String channelName) {
        NotificationManager nm = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
        if (nm == null || Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
            return super.onNotifyNotificationWithChannel(platformTag, platformId, notification, channelName);
        }
        if (!nm.areNotificationsEnabled()) return false;
        if (nm.getNotificationChannel(CHANNEL_ID) == null) {
            NotificationChannel ch = new NotificationChannel(CHANNEL_ID, "تذكيرات تربوي", NotificationManager.IMPORTANCE_HIGH);
            ch.setDescription("تذكير يومي بالدراسة ومراجعة الأخطاء");
            ch.enableVibration(true);
            ch.setVibrationPattern(new long[] {0, 200, 100, 200});
            ch.setSound(RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION),
                    new AudioAttributes.Builder().setUsage(AudioAttributes.USAGE_NOTIFICATION).build());
            ch.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);
            nm.createNotificationChannel(ch);
        }
        Notification n = Notification.Builder.recoverBuilder(this, notification).setChannelId(CHANNEL_ID).build();
        nm.notify(platformTag, platformId, n);
        return true;
    }
}
