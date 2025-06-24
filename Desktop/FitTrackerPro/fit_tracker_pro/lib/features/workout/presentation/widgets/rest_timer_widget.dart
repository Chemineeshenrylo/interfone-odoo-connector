import 'package:flutter/material.dart';
import 'dart:ui';

/// Widget de timer de repos
/// 
/// **Fonctionnalités:**
/// - Affichage en plein écran avec overlay
/// - Compte à rebours visuel et numérique
/// - Animation de progression circulaire
/// - Bouton pour ignorer le repos
/// - Vibration/son à la fin (optionnel)
class RestTimerWidget extends StatelessWidget {
  final Duration timeRemaining;
  final VoidCallback onSkip;
  final Duration? originalDuration;

  const RestTimerWidget({
    super.key,
    required this.timeRemaining,
    required this.onSkip,
    this.originalDuration,
  });

  @override
  Widget build(BuildContext context) {
    final total = originalDuration ?? const Duration(seconds: 90);
    final progress = timeRemaining.inSeconds / total.inSeconds;
    
    return Container(
      width: double.infinity,
      height: 200,
      margin: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            Colors.blue[400]!,
            Colors.blue[600]!,
          ],
        ),
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.blue.withOpacity(0.3),
            blurRadius: 10,
            spreadRadius: 2,
          ),
        ],
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(16),
        child: BackdropFilter(
          filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
          child: Container(
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.1),
              borderRadius: BorderRadius.circular(16),
            ),
            child: Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  _buildTimerDisplay(progress, context),
                  const SizedBox(height: 16),
                  _buildTimeText(),
                  const SizedBox(height: 16),
                  _buildActionButtons(context),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  /// Affichage principal du timer avec cercle de progression
  Widget _buildTimerDisplay(double progress, BuildContext context) {
    return SizedBox(
      width: 100,
      height: 100,
      child: Stack(
        children: [
          // Cercle de fond
          Container(
            width: 100,
            height: 100,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: Colors.white.withOpacity(0.2),
            ),
          ),
          // Cercle de progression
          SizedBox(
            width: 100,
            height: 100,
            child: CircularProgressIndicator(
              value: progress,
              strokeWidth: 6,
              backgroundColor: Colors.white.withOpacity(0.3),
              valueColor: const AlwaysStoppedAnimation<Color>(Colors.white),
            ),
          ),
          // Icône de repos au centre
          const Center(
            child: Icon(
              Icons.self_improvement,
              color: Colors.white,
              size: 40,
            ),
          ),
        ],
      ),
    );
  }

  /// Affichage du temps restant
  Widget _buildTimeText() {
    final minutes = timeRemaining.inMinutes;
    final seconds = timeRemaining.inSeconds.remainder(60);
    
    return Column(
      children: [
        Text(
          'Temps de repos',
          style: const TextStyle(
            color: Colors.white,
            fontSize: 16,
            fontWeight: FontWeight.w500,
          ),
        ),
        const SizedBox(height: 4),
        Text(
          '${minutes.toString().padLeft(2, '0')}:${seconds.toString().padLeft(2, '0')}',
          style: const TextStyle(
            color: Colors.white,
            fontSize: 32,
            fontWeight: FontWeight.bold,
            fontFeatures: [FontFeature.tabularFigures()],
          ),
        ),
      ],
    );
  }

  /// Boutons d'action
  Widget _buildActionButtons(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceEvenly,
      children: [
        // Bouton ignorer
        ElevatedButton.icon(
          onPressed: onSkip,
          icon: const Icon(Icons.skip_next, size: 18),
          label: const Text('Ignorer'),
          style: ElevatedButton.styleFrom(
            backgroundColor: Colors.white.withOpacity(0.2),
            foregroundColor: Colors.white,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(20),
            ),
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          ),
        ),
        // Bouton ajouter du temps
        ElevatedButton.icon(
          onPressed: () => _showAddTimeDialog(context),
          icon: const Icon(Icons.add, size: 18),
          label: const Text('+30s'),
          style: ElevatedButton.styleFrom(
            backgroundColor: Colors.white.withOpacity(0.2),
            foregroundColor: Colors.white,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(20),
            ),
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          ),
        ),
      ],
    );
  }

  /// Dialog pour ajouter du temps
  void _showAddTimeDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Ajouter du temps'),
        content: const Text('Combien de temps voulez-vous ajouter ?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('Annuler'),
          ),
          TextButton(
            onPressed: () {
              Navigator.of(context).pop();
              // TODO: Implémenter l'ajout de 30 secondes
            },
            child: const Text('+30s'),
          ),
          TextButton(
            onPressed: () {
              Navigator.of(context).pop();
              // TODO: Implémenter l'ajout de 60 secondes
            },
            child: const Text('+1 min'),
          ),
        ],
      ),
    );
  }
}

/// Version plein écran du timer de repos
class FullScreenRestTimer extends StatelessWidget {
  final Duration timeRemaining;
  final Duration originalDuration;
  final VoidCallback onSkip;
  final VoidCallback onAddTime;

  const FullScreenRestTimer({
    super.key,
    required this.timeRemaining,
    required this.originalDuration,
    required this.onSkip,
    required this.onAddTime,
  });

  @override
  Widget build(BuildContext context) {
    final progress = timeRemaining.inSeconds / originalDuration.inSeconds;
    
    return Scaffold(
      backgroundColor: Colors.black.withOpacity(0.8),
      body: Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [
              Colors.blue[400]!,
              Colors.blue[800]!,
            ],
          ),
        ),
        child: SafeArea(
          child: Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Text(
                  'TEMPS DE REPOS',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 24,
                    fontWeight: FontWeight.bold,
                    letterSpacing: 2,
                  ),
                ),
                const SizedBox(height: 40),
                
                // Timer principal
                SizedBox(
                  width: 200,
                  height: 200,
                  child: Stack(
                    children: [
                      // Cercle de progression
                      SizedBox(
                        width: 200,
                        height: 200,
                        child: CircularProgressIndicator(
                          value: progress,
                          strokeWidth: 10,
                          backgroundColor: Colors.white.withOpacity(0.3),
                          valueColor: const AlwaysStoppedAnimation<Color>(Colors.white),
                        ),
                      ),
                      // Temps au centre
                      Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Text(
                              _formatTime(timeRemaining),
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 48,
                                fontWeight: FontWeight.bold,
                                fontFeatures: [FontFeature.tabularFigures()],
                              ),
                            ),
                            const Text(
                              'restant',
                              style: TextStyle(
                                color: Colors.white70,
                                fontSize: 16,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
                
                const SizedBox(height: 60),
                
                // Boutons d'action
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                  children: [
                    // Ajouter du temps
                    ElevatedButton.icon(
                      onPressed: onAddTime,
                      icon: const Icon(Icons.add_circle_outline),
                      label: const Text('+ 30s'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.white.withOpacity(0.2),
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(25),
                        ),
                      ),
                    ),
                    
                    // Ignorer le repos
                    ElevatedButton.icon(
                      onPressed: onSkip,
                      icon: const Icon(Icons.skip_next),
                      label: const Text('Continuer'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.white,
                        foregroundColor: Colors.blue[800],
                        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(25),
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  String _formatTime(Duration duration) {
    final minutes = duration.inMinutes;
    final seconds = duration.inSeconds.remainder(60);
    return '${minutes.toString().padLeft(2, '0')}:${seconds.toString().padLeft(2, '0')}';
  }
}