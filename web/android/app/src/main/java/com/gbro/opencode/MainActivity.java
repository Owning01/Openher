package com.gbro.opencode;

import android.content.Intent;

import com.getcapacitor.BridgeActivity;
import com.getcapacitor.PluginHandle;

public class MainActivity extends BridgeActivity {

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
