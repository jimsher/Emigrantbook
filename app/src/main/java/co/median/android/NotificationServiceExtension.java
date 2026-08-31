package co.median.android;

import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import androidx.core.app.NotificationCompat;
import androidx.core.app.Person;
import androidx.core.graphics.drawable.IconCompat;
import com.onesignal.notifications.INotificationReceivedEvent;
import com.onesignal.notifications.INotificationServiceExtension;
import java.io.InputStream;
import java.net.URL;

public class NotificationServiceExtension implements INotificationServiceExtension {
    @Override
    public void onNotificationReceived(INotificationReceivedEvent event) {
        String title = event.getNotification().getTitle();
        String body = event.getNotification().getBody();
        String avatarUrl = event.getNotification().getLargeIcon();

        Bitmap avatarBitmap = null;
        try {
            if (avatarUrl != null && !avatarUrl.isEmpty()) {
                InputStream in = new URL(avatarUrl).openStream();
                avatarBitmap = BitmapFactory.decodeStream(in);
            }
        } catch (Exception e) {
            e.printStackTrace();
        }

        Person.Builder personBuilder = new Person.Builder().setName(title != null ? title : "Emigrantbook");
        if (avatarBitmap != null) {
            personBuilder.setIcon(IconCompat.createWithBitmap(avatarBitmap));
        }
        Person sender = personBuilder.build();

        NotificationCompat.MessagingStyle messagingStyle = new NotificationCompat.MessagingStyle(sender)
                .addMessage(body != null ? body : "", System.currentTimeMillis(), sender);

        event.getNotification().setExtender(builder -> builder.setStyle(messagingStyle));
    }
}
