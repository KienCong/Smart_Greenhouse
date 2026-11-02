#pragma once

class WifiManager {
private:
    static unsigned long lastReconnectAttempt;

public:
    static void begin();
    static void reconnect();
    static bool isConnected();
};