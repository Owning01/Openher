package com.gbro.openher;

import android.content.Intent;

import com.getcapacitor.BridgeActivity;
import com.getcapacitor.PluginHandle;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(android.os.Bundle savedInstanceState) {
        // Plugins locales del proyecto: sin registerPlugin acá el bridge no los
        // conoce (ShareReceiver nunca estuvo registrado: el share-a-OpenHer no
        // llegaba al JS).
        registerPlugin(ShareReceiverPlugin.class);
        registerPlugin(AppInstallerPlugin.class);
        super.onCreate(savedInstanceState);
    }

    @Override
    public void onStart() {
        super.onStart();
        try {
            if (getBridge() != null && getBridge().getWebView() != null) {
                android.webkit.WebView wv = getBridge().getWebView();
                wv.setLayerType(android.view.View.LAYER_TYPE_HARDWARE, null);
                android.webkit.WebSettings s = wv.getSettings();
                s.setSupportZoom(false);
                s.setBuiltInZoomControls(false);
                s.setDisplayZoomControls(false);
                s.setMixedContentMode(android.webkit.WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
            }
        } catch (Exception ignored) {}
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        // Pasar el share entrante (ACTION_SEND) al plugin ShareReceiver
        PluginHandle handle = getBridge().getPlugin("ShareReceiver");
        if (handle != null && handle.getInstance() instanceof ShareReceiverPlugin) {
            ((ShareReceiverPlugin) handle.getInstance()).onNewIntent(intent);
        }
    }
}
