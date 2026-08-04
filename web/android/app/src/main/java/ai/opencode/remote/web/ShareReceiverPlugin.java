package ai.opencode.remote.web;

import android.content.Intent;
import android.net.Uri;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * Recibe ACTION_SEND (Share to OpenCode): texto/imagen desde cualquier app
 * de Android queda en un buffer y se entrega al JS cuando la web app lo pide.
 */
@CapacitorPlugin(name = "ShareReceiver")
public class ShareReceiverPlugin extends Plugin {

    private String pendingText = null;
    private String pendingUri = null;
    private String pendingType = null;

    public void onNewIntent(Intent intent) {
        capture(intent);
        notifyListeners("shared", payload(), false);
    }

    private void capture(Intent intent) {
        pendingText = null;
        pendingUri = null;
        pendingType = intent.getType();
        if (intent.getType() != null && intent.getType().startsWith("text/")) {
            pendingText = intent.getStringExtra(Intent.EXTRA_TEXT);
            pendingUri = intent.getStringExtra(Intent.EXTRA_STREAM) != null
                ? intent.getStringExtra(Intent.EXTRA_STREAM) : null;
        } else if (intent.getParcelableExtra(Intent.EXTRA_STREAM) instanceof Uri) {
            pendingUri = ((Uri) intent.getParcelableExtra(Intent.EXTRA_STREAM)).toString();
        }
    }

    private JSObject payload() {
        JSObject obj = new JSObject();
        obj.put("text", pendingText != null ? pendingText : "");
        obj.put("uri", pendingUri != null ? pendingUri : "");
        obj.put("type", pendingType != null ? pendingType : "");
        return obj;
    }

    @PluginMethod
    public void getPendingShare(PluginCall call) {
        call.resolve(payload());
    }

    @PluginMethod
    public void clearPendingShare(PluginCall call) {
        pendingText = null;
        pendingUri = null;
        pendingType = null;
        call.resolve();
    }
}
