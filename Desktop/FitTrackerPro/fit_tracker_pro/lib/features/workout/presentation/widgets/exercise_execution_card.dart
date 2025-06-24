import 'package:flutter/material.dart';
import 'package:fit_tracker_pro/features/workout/domain/entities/workout_exercise.dart';
import 'package:fit_tracker_pro/features/workout/domain/entities/workout_set.dart';

/// Widget pour l'exécution d'un exercice
/// 
/// **Fonctionnalités:**
/// - Affichage des informations de l'exercice
/// - Interface de saisie des séries (poids/reps)
/// - Validation des valeurs saisies
/// - Timer de repos entre séries
/// - Progression visuelle des séries
class ExerciseExecutionCard extends StatefulWidget {
  final WorkoutExercise exercise;
  final int exerciseIndex;
  final bool isActive;
  final Function(int setIndex, WorkoutSet updatedSet) onSetUpdated;
  final Function(Duration duration) onStartRest;

  const ExerciseExecutionCard({
    super.key,
    required this.exercise,
    required this.exerciseIndex,
    required this.isActive,
    required this.onSetUpdated,
    required this.onStartRest,
  });

  @override
  State<ExerciseExecutionCard> createState() => _ExerciseExecutionCardState();
}

class _ExerciseExecutionCardState extends State<ExerciseExecutionCard> {
  final Map<int, TextEditingController> _weightControllers = {};
  final Map<int, TextEditingController> _repsControllers = {};
  final Map<int, FocusNode> _weightFocusNodes = {};
  final Map<int, FocusNode> _repsFocusNodes = {};

  @override
  void initState() {
    super.initState();
    _initializeControllers();
  }

  @override
  void dispose() {
    _disposeControllers();
    super.dispose();
  }

  void _initializeControllers() {
    for (int i = 0; i < widget.exercise.sets.length; i++) {
      final set = widget.exercise.sets[i];
      
      _weightControllers[i] = TextEditingController(
        text: set.actualWeight != null ? set.actualWeight.toString() : '',
      );
      _repsControllers[i] = TextEditingController(
        text: set.actualReps != null ? set.actualReps.toString() : '',
      );
      _weightFocusNodes[i] = FocusNode();
      _repsFocusNodes[i] = FocusNode();
    }
  }

  void _disposeControllers() {
    for (final controller in _weightControllers.values) {
      controller.dispose();
    }
    for (final controller in _repsControllers.values) {
      controller.dispose();
    }
    for (final node in _weightFocusNodes.values) {
      node.dispose();
    }
    for (final node in _repsFocusNodes.values) {
      node.dispose();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.all(16),
      child: Card(
        elevation: widget.isActive ? 8 : 2,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
          side: widget.isActive
              ? BorderSide(color: Theme.of(context).primaryColor, width: 2)
              : BorderSide.none,
        ),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _buildHeader(),
              const SizedBox(height: 16),
              _buildExerciseInfo(),
              const SizedBox(height: 16),
              _buildSetsTable(),
            ],
          ),
        ),
      ),
    );
  }

  /// En-tête avec nom de l'exercice et progression
  Widget _buildHeader() {
    final completedSets = widget.exercise.sets.where((s) => s.isCompleted).length;
    final totalSets = widget.exercise.sets.length;

    return Row(
      children: [
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                widget.exercise.exercise.name,
                style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                '${widget.exercise.exercise.category.displayName} • ${widget.exercise.exercise.equipment.displayName}',
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: Colors.grey[600],
                ),
              ),
            ],
          ),
        ),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
          decoration: BoxDecoration(
            color: widget.isActive 
                ? Theme.of(context).primaryColor
                : Colors.grey[300],
            borderRadius: BorderRadius.circular(20),
          ),
          child: Text(
            '$completedSets/$totalSets séries',
            style: TextStyle(
              color: widget.isActive ? Colors.white : Colors.grey[700],
              fontWeight: FontWeight.bold,
              fontSize: 12,
            ),
          ),
        ),
      ],
    );
  }

  /// Informations sur l'exercice
  Widget _buildExerciseInfo() {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.grey[50],
        borderRadius: BorderRadius.circular(8),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Groupes musculaires:',
            style: Theme.of(context).textTheme.labelMedium?.copyWith(
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 4),
          Wrap(
            spacing: 4,
            children: widget.exercise.exercise.muscleGroups
                .map((muscle) => Chip(
                      label: Text(
                        muscle.displayName,
                        style: const TextStyle(fontSize: 10),
                      ),
                      backgroundColor: Colors.blue[100],
                      materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
                    ))
                .toList(),
          ),
          if (widget.exercise.exercise.instructions.isNotEmpty) ...[
            const SizedBox(height: 8),
            Text(
              'Instructions:',
              style: Theme.of(context).textTheme.labelMedium?.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              widget.exercise.exercise.instructions,
              style: Theme.of(context).textTheme.bodySmall,
            ),
          ],
        ],
      ),
    );
  }

  /// Tableau des séries
  Widget _buildSetsTable() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Séries',
          style: Theme.of(context).textTheme.titleMedium?.copyWith(
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 8),
        Table(
          columnWidths: const {
            0: FixedColumnWidth(40),
            1: FlexColumnWidth(2),
            2: FlexColumnWidth(2),
            3: FixedColumnWidth(60),
          },
          children: [
            _buildTableHeader(),
            ...widget.exercise.sets.asMap().entries.map(
              (entry) => _buildSetRow(entry.key, entry.value),
            ),
          ],
        ),
      ],
    );
  }

  /// En-tête du tableau des séries
  TableRow _buildTableHeader() {
    return TableRow(
      decoration: BoxDecoration(
        color: Colors.grey[100],
        borderRadius: BorderRadius.circular(4),
      ),
      children: [
        _buildTableCell('Série', isHeader: true),
        _buildTableCell('Poids (kg)', isHeader: true),
        _buildTableCell('Reps', isHeader: true),
        _buildTableCell('Status', isHeader: true),
      ],
    );
  }

  /// Ligne pour une série
  TableRow _buildSetRow(int index, WorkoutSet set) {
    final isCompleted = set.isCompleted;
    final canEdit = widget.isActive && !isCompleted;

    return TableRow(
      decoration: BoxDecoration(
        color: isCompleted ? Colors.green[50] : null,
      ),
      children: [
        _buildTableCell('${index + 1}'),
        _buildWeightInput(index, set, canEdit),
        _buildRepsInput(index, set, canEdit),
        _buildSetActions(index, set),
      ],
    );
  }

  /// Cellule standard du tableau
  Widget _buildTableCell(String text, {bool isHeader = false}) {
    return Padding(
      padding: const EdgeInsets.all(8.0),
      child: Text(
        text,
        style: isHeader
            ? const TextStyle(fontWeight: FontWeight.bold, fontSize: 12)
            : const TextStyle(fontSize: 12),
        textAlign: TextAlign.center,
      ),
    );
  }

  /// Input pour le poids
  Widget _buildWeightInput(int index, WorkoutSet set, bool canEdit) {
    return Padding(
      padding: const EdgeInsets.all(4.0),
      child: TextField(
        controller: _weightControllers[index],
        focusNode: _weightFocusNodes[index],
        enabled: canEdit,
        keyboardType: const TextInputType.numberWithOptions(decimal: true),
        textAlign: TextAlign.center,
        style: const TextStyle(fontSize: 12),
        decoration: InputDecoration(
          isDense: true,
          contentPadding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(4),
          ),
          hintText: set.targetWeight?.toString() ?? '0',
        ),
        onChanged: (value) => _updateSetValue(index, weight: value),
      ),
    );
  }

  /// Input pour les répétitions
  Widget _buildRepsInput(int index, WorkoutSet set, bool canEdit) {
    return Padding(
      padding: const EdgeInsets.all(4.0),
      child: TextField(
        controller: _repsControllers[index],
        focusNode: _repsFocusNodes[index],
        enabled: canEdit,
        keyboardType: TextInputType.number,
        textAlign: TextAlign.center,
        style: const TextStyle(fontSize: 12),
        decoration: InputDecoration(
          isDense: true,
          contentPadding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(4),
          ),
          hintText: set.targetReps?.toString() ?? '0',
        ),
        onChanged: (value) => _updateSetValue(index, reps: value),
      ),
    );
  }

  /// Actions pour une série (valider, timer repos)
  Widget _buildSetActions(int index, WorkoutSet set) {
    return Padding(
      padding: const EdgeInsets.all(4.0),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          if (set.isCompleted)
            const Icon(
              Icons.check_circle,
              color: Colors.green,
              size: 20,
            )
          else if (widget.isActive) ...[
            IconButton(
              onPressed: () => _completeSet(index),
              icon: const Icon(Icons.check, size: 16),
              style: IconButton.styleFrom(
                backgroundColor: Colors.green,
                foregroundColor: Colors.white,
                minimumSize: const Size(28, 28),
              ),
            ),
          ] else
            const Icon(
              Icons.pending,
              color: Colors.grey,
              size: 20,
            ),
        ],
      ),
    );
  }

  /// Met à jour les valeurs d'une série
  void _updateSetValue(int index, {String? weight, String? reps}) {
    final currentSet = widget.exercise.sets[index];
    
    final updatedSet = currentSet.copyWith(
      actualWeight: weight != null ? double.tryParse(weight) : currentSet.actualWeight,
      actualReps: reps != null ? int.tryParse(reps) : currentSet.actualReps,
    );

    widget.onSetUpdated(index, updatedSet);
  }

  /// Marque une série comme terminée
  void _completeSet(int index) {
    final currentSet = widget.exercise.sets[index];
    final weight = double.tryParse(_weightControllers[index]?.text ?? '');
    final reps = int.tryParse(_repsControllers[index]?.text ?? '');

    if (weight == null || reps == null || weight <= 0 || reps <= 0) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Veuillez saisir des valeurs valides'),
          backgroundColor: Colors.red,
        ),
      );
      return;
    }

    final completedSet = currentSet.copyWith(
      actualWeight: weight,
      actualReps: reps,
      completedAt: DateTime.now(),
    );

    widget.onSetUpdated(index, completedSet);

    // Démarrer le timer de repos si ce n'est pas la dernière série
    if (index < widget.exercise.sets.length - 1) {
      _showRestDialog(index);
    }
  }

  /// Affiche le dialog pour le temps de repos
  void _showRestDialog(int setIndex) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Temps de repos'),
        content: const Text('Combien de temps voulez-vous vous reposer ?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('Passer'),
          ),
          TextButton(
            onPressed: () {
              Navigator.of(context).pop();
              widget.onStartRest(const Duration(seconds: 60));
            },
            child: const Text('1 min'),
          ),
          TextButton(
            onPressed: () {
              Navigator.of(context).pop();
              widget.onStartRest(const Duration(seconds: 90));
            },
            child: const Text('1m30'),
          ),
          TextButton(
            onPressed: () {
              Navigator.of(context).pop();
              widget.onStartRest(const Duration(seconds: 120));
            },
            child: const Text('2 min'),
          ),
        ],
      ),
    );
  }
}