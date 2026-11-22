package il.co.elhabriut.hamesader;

import android.content.Intent;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.net.Uri;
import android.os.Bundle;
import android.util.Base64;
import com.getcapacitor.BridgeActivity;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import org.json.JSONObject;

/**
 * Receives content shared from other apps (WhatsApp, Chrome, Gallery...) and hands it to the web app,
 * which opens the "add" sheet already filled in and classified.
 */
public class MainActivity extends BridgeActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        handleShare(getIntent());
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        handleShare(intent);
    }

    private void handleShare(Intent intent) {
        if (intent == null || !Intent.ACTION_SEND.equals(intent.getAction())) return;
        try {
            JSONObject payload = new JSONObject();
            String subject = intent.getStringExtra(Intent.EXTRA_SUBJECT);
            String text = intent.getStringExtra(Intent.EXTRA_TEXT);
            String joined = ((subject != null ? subject + " " : "") + (text != null ? text : "")).trim();
            payload.put("id", System.currentTimeMillis());
            payload.put("text", joined);
            String type = intent.getType();
            if (type != null && type.startsWith("image/")) {
                Uri uri = intent.getParcelableExtra(Intent.EXTRA_STREAM);
                if (uri != null) payload.put("image", imageToDataUrl(uri));
            }
            final String js = "window.__hamesaderShare=" + payload.toString() + ";window.dispatchEvent(new Event('hamesader-share'));";
            // Deliver a few times: on a cold start the page may still be loading. The web app ignores repeats by id.
            for (long delay : new long[] {300, 1200, 2500, 5000}) {
                getBridge().getWebView().postDelayed(() -> getBridge().getWebView().evaluateJavascript(js, null), delay);
            }
        } catch (Exception ignored) {
            // A failed share should never crash the app
        }
        intent.setAction(Intent.ACTION_MAIN);
    }

    private String imageToDataUrl(Uri uri) throws Exception {
        try (InputStream in = getContentResolver().openInputStream(uri)) {
            Bitmap bmp = BitmapFactory.decodeStream(in);
            if (bmp == null) return null;
            float scale = Math.min(1f, 900f / Math.max(bmp.getWidth(), bmp.getHeight()));
            Bitmap scaled = Bitmap.createScaledBitmap(bmp, Math.round(bmp.getWidth() * scale), Math.round(bmp.getHeight() * scale), true);
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            scaled.compress(Bitmap.CompressFormat.JPEG, 78, out);
            return "data:image/jpeg;base64," + Base64.encodeToString(out.toByteArray(), Base64.NO_WRAP);
        }
    }
}
