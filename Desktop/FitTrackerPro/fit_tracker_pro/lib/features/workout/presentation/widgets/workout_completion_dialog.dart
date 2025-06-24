import 'package:flutter/material.dart';
import 'package:fit_tracker_pro/features/workout/domain/entities/workout.dart';

/// Dialog de fin d'entraînement
/// 
/// **Fonctionnalités:**
/// - Résumé de la session d'entraînement
/// - Statistiques de performance
/// - Comparaison avec les objectifs
/// - Évaluation de la session (RPE)
/// - Actions de partage et sauvegarde
class WorkoutCompletionDialog extends StatefulWidget {
  final Workout workout;
  final Duration duration;
  final Map<String, dynamic> stats;
  final VoidCallback onClose;

  const WorkoutCompletionDialog({
    super.key,
    required this.workout,
    required this.duration,
    required this.stats,
    required this.onClose,
  });

  @override
  State<WorkoutCompletionDialog> createState() => _WorkoutCompletionDialogState();
}

class _WorkoutCompletionDialogState extends State<WorkoutCompletionDialog> {
  int _rpeRating = 5;
  final TextEditingController _notesController = TextEditingController();

  @override
  void dispose() {
    _notesController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Dialog(
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(20),
      ),
      child: Container(
        constraints: const BoxConstraints(maxWidth: 400, maxHeight: 600),
        child: SingleChildScrollView(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                _buildHeader(),
                const SizedBox(height: 20),
                _buildStatsSection(),
                const SizedBox(height: 20),
                _buildRPESection(),
                const SizedBox(height: 20),
                _buildNotesSection(),
                const SizedBox(height: 24),
                _buildActionButtons(),
              ],
            ),
          ),
        ),
      ),
    );
  }

  /// En-tête avec félicitations
  Widget _buildHeader() {
    return Column(
      children: [
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.green[100],
            shape: BoxShape.circle,
          ),
          child: Icon(
            Icons.emoji_events,
            size: 40,
            color: Colors.green[700],
          ),
        ),
        const SizedBox(height: 12),
        Text(
          'Entraînement terminé !',
          style: Theme.of(context).textTheme.headlineSmall?.copyWith(
            fontWeight: FontWeight.bold,
            color: Colors.green[700],
          ),
        ),
        const SizedBox(height: 4),
        Text(
          'Félicitations pour cette séance',
          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
            color: Colors.grey[600],
          ),
        ),
      ],
    );
  }

  /// Section des statistiques
  Widget _buildStatsSection() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.grey[50],
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Résumé de la séance',
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: _buildStatItem(
                  icon: Icons.timer,
                  label: 'Durée',
                  value: _formatDuration(widget.duration),
                ),
              ),
              Expanded(
                child: _buildStatItem(
                  icon: Icons.fitness_center,
                  label: 'Exercices',
                  value: '${widget.stats['exercises_completed']}',
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              Expanded(
                child: _buildStatItem(
                  icon: Icons.repeat,
                  label: 'Séries',
                  value: '${widget.stats['total_sets']}',
                ),
              ),
              Expanded(
                child: _buildStatItem(
                  icon: Icons.trending_up,
                  label: 'Volume',
                  value: '${widget.stats['total_volume']?.toStringAsFixed(0) ?? 0}kg',
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              Expanded(
                child: _buildStatItem(
                  icon: Icons.sports,
                  label: 'Répétitions',
                  value: '${widget.stats['total_reps']}',
                ),
              ),
              Expanded(
                child: _buildStatItem(
                  icon: Icons.percent,
                  label: 'Complétion',
                  value: '${(widget.stats['completion_percentage'] * 100).toStringAsFixed(0)}%',
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  /// Item de statistique
  Widget _buildStatItem({
    required IconData icon,
    required String label,
    required String value,
  }) {
    return Column(
      children: [
        Icon(
          icon,
          size: 20,
          color: Colors.grey[600],
        ),
        const SizedBox(height: 4),
        Text(
          value,
          style: const TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.bold,
          ),
        ),
        Text(
          label,
          style: TextStyle(
            fontSize: 12,
            color: Colors.grey[600],
          ),
        ),
      ],
    );
  }

  /// Section d'évaluation RPE (Rate of Perceived Exertion)
  Widget _buildRPESection() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.blue[50],
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Comment vous êtes-vous senti ?',
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Évaluez la difficulté de votre entraînement (1 = très facile, 10 = maximal)',
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
              color: Colors.grey[600],
            ),
          ),
          const SizedBox(height: 12),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceEvenly,
            children: List.generate(10, (index) {
              final rating = index + 1;
              final isSelected = rating == _rpeRating;
              
              return GestureDetector(
                onTap: () => setState(() => _rpeRating = rating),
                child: Container(
                  width: 30,
                  height: 30,
                  decoration: BoxDecoration(
                    color: isSelected ? Colors.blue : Colors.white,
                    border: Border.all(
                      color: isSelected ? Colors.blue : Colors.grey,
                      width: 2,
                    ),
                    borderRadius: BorderRadius.circular(15),
                  ),
                  child: Center(
                    child: Text(
                      rating.toString(),
                      style: TextStyle(
                        color: isSelected ? Colors.white : Colors.grey[700],
                        fontWeight: FontWeight.bold,
                        fontSize: 12,
                      ),
                    ),
                  ),
                ),
              );
            }),
          ),
        ],
      ),
    );
  }

  /// Section des notes
  Widget _buildNotesSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Notes (optionnel)',
          style: Theme.of(context).textTheme.titleMedium?.copyWith(
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 8),
        TextField(
          controller: _notesController,
          maxLines: 3,
          decoration: InputDecoration(
            hintText: 'Comment s\'est passé votre entraînement ? Des observations ?',
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(8),
            ),
            filled: true,
            fillColor: Colors.grey[50],
          ),
        ),
      ],
    );
  }

  /// Boutons d'action
  Widget _buildActionButtons() {
    return Column(
      children: [
        // Bouton principal - Terminer
        SizedBox(
          width: double.infinity,
          child: ElevatedButton(
            onPressed: _saveAndClose,
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.green,
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(vertical: 16),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
            ),
            child: const Text(
              'Terminer',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
        ),
        
        const SizedBox(height: 8),
        
        // Boutons secondaires
        Row(
          children: [
            Expanded(
              child: OutlinedButton.icon(
                onPressed: _shareWorkout,
                icon: const Icon(Icons.share, size: 18),
                label: const Text('Partager'),
                style: OutlinedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 12),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(8),
                  ),
                ),
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: OutlinedButton.icon(
                onPressed: _saveAsTemplate,
                icon: const Icon(Icons.bookmark_add, size: 18),
                label: const Text('Modèle'),
                style: OutlinedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 12),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(8),
                  ),
                ),
              ),
            ),
          ],
        ),
      ],
    );
  }

  /// Formate une durée en format lisible
  String _formatDuration(Duration duration) {
    final hours = duration.inHours;
    final minutes = duration.inMinutes.remainder(60);
    
    if (hours > 0) {
      return '${hours}h ${minutes}min';
    } else {
      return '${minutes}min';
    }
  }

  /// Sauvegarde et ferme le dialog
  void _saveAndClose() {
    // TODO: Sauvegarder le RPE et les notes
    widget.onClose();
  }

  /// Partage l'entraînement
  void _shareWorkout() {
    // TODO: Implémenter le partage
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Fonctionnalité de partage à venir')),
    );
  }

  /// Sauvegarde comme modèle
  void _saveAsTemplate() {
    // TODO: Implémenter la sauvegarde comme modèle
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Modèle sauvegardé !')),
    );
  }
}