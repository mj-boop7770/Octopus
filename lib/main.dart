import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_v2ray/flutter_v2ray.dart';

void main() => runApp(const MyApp());

class MyApp extends StatelessWidget {
  const MyApp({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return const MaterialApp(
      home: TunnelScreen(),
      debugShowCheckedModeBanner: false,
    );
  }
}

class TunnelScreen extends StatefulWidget {
  const TunnelScreen({Key? key}) : super(key: key);

  @override
  State<TunnelScreen> createState() => _TunnelScreenState();
}

class _TunnelScreenState extends State<TunnelScreen> {
  late FlutterV2ray flutterV2ray;
  bool isConnected = false;

  @override
  void initState() {
    super.initState();
    // Liaison avec le noyau Go de l'application
    flutterV2ray = FlutterV2ray(
      onStatusChange: (status) {
        setState(() {
          isConnected = status.state == "CONNECTED";
        });
      },
    );
    flutterV2ray.initializeV2Ray();
  }

  void toggleConnection() async {
    if (isConnected) {
      await flutterV2ray.stopV2Ray();
    } else {
      // 1. Charger le fichier config.json créé à l'étape 2
      String configString = await rootBundle.loadString('assets/config.json');
      
      // 2. Demander l'autorisation VPN au système (la clé Android)
      if (await flutterV2ray.requestPermission()) {
        // 3. Injecter la configuration et démarrer le tunnel
        await flutterV2ray.startV2Ray(
          remark: "Mon Tunnel Perso",
          config: configString,
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF121212),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(
              isConnected ? "Tunnel Actif" : "Tunnel Déconnecté",
              style: TextStyle(
                color: isConnected ? Colors.green : Colors.red, 
                fontSize: 24, 
                fontWeight: FontWeight.bold
              ),
            ),
            const SizedBox(height: 40),
            ElevatedButton(
              onPressed: toggleConnection,
              style: ElevatedButton.styleFrom(
                backgroundColor: isConnected ? Colors.red : Colors.blueAccent,
                padding: const EdgeInsets.symmetric(horizontal: 50, vertical: 20),
              ),
              child: Text(isConnected ? "STOP" : "START", style: const TextStyle(fontSize: 18)),
            ),
          ],
        ),
      ),
    );
  }
}
