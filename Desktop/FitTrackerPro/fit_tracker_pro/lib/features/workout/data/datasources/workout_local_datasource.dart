import 'package:hive/hive.dart';
import 'package:fit_tracker_pro/core/errors/exceptions.dart';
import '../models/workout_model.dart';
import '../models/exercise_model.dart';

/// Interface pour l'accès aux données locales des workouts
/// 
/// Définit le contrat pour la persistance locale avec Hive.
abstract class WorkoutLocalDataSource {
  /// Récupère tous les workouts stockés localement
  Future<List<WorkoutModel>> getCachedWorkouts();

  /// Récupère un workout par son ID
  Future<WorkoutModel?> getCachedWorkoutById(String id);

  /// Cache un workout localement
  Future<void> cacheWorkout(WorkoutModel workout);

  /// Cache une liste de workouts
  Future<void> cacheWorkouts(List<WorkoutModel> workouts);

  /// Supprime un workout du cache
  Future<void> removeWorkoutFromCache(String id);

  /// Vide tout le cache des workouts
  Future<void> clearWorkoutCache();

  /// Récupère tous les exercices stockés localement
  Future<List<ExerciseModel>> getCachedExercises();

  /// Cache un exercice localement
  Future<void> cacheExercise(ExerciseModel exercise);

  /// Cache une liste d'exercices
  Future<void> cacheExercises(List<ExerciseModel> exercises);

  /// Récupère les workouts par statut
  Future<List<WorkoutModel>> getCachedWorkoutsByStatus(String status);

  /// Récupère les workouts dans une plage de dates
  Future<List<WorkoutModel>> getCachedWorkoutsByDateRange(
    DateTime startDate,
    DateTime endDate,
  );

  /// Recherche des workouts par nom
  Future<List<WorkoutModel>> searchCachedWorkouts(String query);

  /// Récupère les templates
  Future<List<WorkoutModel>> getCachedTemplates();
}

/// Implémentation Hive du datasource local
class WorkoutLocalDataSourceImpl implements WorkoutLocalDataSource {
  static const String _workoutBoxName = 'workouts';
  static const String _exerciseBoxName = 'exercises';
  static const String _userDataBoxName = 'user_data';
  
  // Clés pour les données utilisateur
  static const String _favoriteExercisesKey = 'favorite_exercises';
  static const String _lastSyncKey = 'last_sync_timestamp';

  /// Box Hive pour les workouts
  Box<WorkoutModel> get _workoutBox => Hive.box<WorkoutModel>(_workoutBoxName);
  
  /// Box Hive pour les exercices
  Box<ExerciseModel> get _exerciseBox => Hive.box<ExerciseModel>(_exerciseBoxName);
  
  /// Box Hive pour les données utilisateur
  Box get _userDataBox => Hive.box(_userDataBoxName);

  @override
  Future<List<WorkoutModel>> getCachedWorkouts() async {
    try {
      return _workoutBox.values.toList();
    } catch (e) {
      throw CacheException(
        message: 'Erreur lors de la récupération des workouts en cache: $e',
      );
    }
  }

  @override
  Future<WorkoutModel?> getCachedWorkoutById(String id) async {
    try {
      return _workoutBox.get(id);
    } catch (e) {
      throw CacheException(
        message: 'Erreur lors de la récupération du workout $id: $e',
      );
    }
  }

  @override
  Future<void> cacheWorkout(WorkoutModel workout) async {
    try {
      await _workoutBox.put(workout.id, workout);
    } catch (e) {
      throw CacheException(
        message: 'Erreur lors de la mise en cache du workout ${workout.id}: $e',
      );
    }
  }

  @override
  Future<void> cacheWorkouts(List<WorkoutModel> workouts) async {
    try {
      final Map<String, WorkoutModel> workoutMap = {
        for (final workout in workouts) workout.id: workout
      };
      await _workoutBox.putAll(workoutMap);
    } catch (e) {
      throw CacheException(
        message: 'Erreur lors de la mise en cache des workouts: $e',
      );
    }
  }

  @override
  Future<void> removeWorkoutFromCache(String id) async {
    try {
      await _workoutBox.delete(id);
    } catch (e) {
      throw CacheException(
        message: 'Erreur lors de la suppression du workout $id: $e',
      );
    }
  }

  @override
  Future<void> clearWorkoutCache() async {
    try {
      await _workoutBox.clear();
    } catch (e) {
      throw CacheException(
        message: 'Erreur lors du nettoyage du cache des workouts: $e',
      );
    }
  }

  @override
  Future<List<ExerciseModel>> getCachedExercises() async {
    try {
      return _exerciseBox.values.toList();
    } catch (e) {
      throw CacheException(
        message: 'Erreur lors de la récupération des exercices en cache: $e',
      );
    }
  }

  @override
  Future<void> cacheExercise(ExerciseModel exercise) async {
    try {
      await _exerciseBox.put(exercise.id, exercise);
    } catch (e) {
      throw CacheException(
        message: 'Erreur lors de la mise en cache de l\'exercice ${exercise.id}: $e',
      );
    }
  }

  @override
  Future<void> cacheExercises(List<ExerciseModel> exercises) async {
    try {
      final Map<String, ExerciseModel> exerciseMap = {
        for (final exercise in exercises) exercise.id: exercise
      };
      await _exerciseBox.putAll(exerciseMap);
    } catch (e) {
      throw CacheException(
        message: 'Erreur lors de la mise en cache des exercices: $e',
      );
    }
  }

  @override
  Future<List<WorkoutModel>> getCachedWorkoutsByStatus(String status) async {
    try {
      return _workoutBox.values
          .where((workout) => workout.statusString == status)
          .toList();
    } catch (e) {
      throw CacheException(
        message: 'Erreur lors de la récupération des workouts par statut: $e',
      );
    }
  }

  @override
  Future<List<WorkoutModel>> getCachedWorkoutsByDateRange(
    DateTime startDate,
    DateTime endDate,
  ) async {
    try {
      return _workoutBox.values
          .where((workout) =>
              workout.scheduledAt.isAfter(startDate.subtract(const Duration(days: 1))) &&
              workout.scheduledAt.isBefore(endDate.add(const Duration(days: 1))))
          .toList();
    } catch (e) {
      throw CacheException(
        message: 'Erreur lors de la récupération des workouts par plage de dates: $e',
      );
    }
  }

  @override
  Future<List<WorkoutModel>> searchCachedWorkouts(String query) async {
    try {
      final lowerQuery = query.toLowerCase();
      return _workoutBox.values
          .where((workout) =>
              workout.name.toLowerCase().contains(lowerQuery) ||
              (workout.description?.toLowerCase().contains(lowerQuery) ?? false) ||
              workout.tags.any((tag) => tag.toLowerCase().contains(lowerQuery)))
          .toList();
    } catch (e) {
      throw CacheException(
        message: 'Erreur lors de la recherche de workouts: $e',
      );
    }
  }

  @override
  Future<List<WorkoutModel>> getCachedTemplates() async {
    try {
      return _workoutBox.values
          .where((workout) => workout.isTemplate)
          .toList();
    } catch (e) {
      throw CacheException(
        message: 'Erreur lors de la récupération des templates: $e',
      );
    }
  }

  /// Récupère les exercices favoris de l'utilisateur
  Future<List<String>> getFavoriteExerciseIds() async {
    try {
      final List<dynamic>? favoriteIds = _userDataBox.get(_favoriteExercisesKey);
      return favoriteIds?.cast<String>() ?? [];
    } catch (e) {
      throw CacheException(
        message: 'Erreur lors de la récupération des exercices favoris',
        details: e,
      );
    }
  }

  /// Sauvegarde les exercices favoris
  Future<void> saveFavoriteExerciseIds(List<String> exerciseIds) async {
    try {
      await _userDataBox.put(_favoriteExercisesKey, exerciseIds);
    } catch (e) {
      throw CacheException(
        message: 'Erreur lors de la sauvegarde des exercices favoris',
        details: e,
      );
    }
  }

  /// Récupère le timestamp de la dernière synchronisation
  Future<DateTime?> getLastSyncTimestamp() async {
    try {
      return _userDataBox.get(_lastSyncKey);
    } catch (e) {
      throw CacheException(
        message: 'Erreur lors de la récupération du timestamp de sync',
        details: e,
      );
    }
  }

  /// Sauvegarde le timestamp de la dernière synchronisation
  Future<void> saveLastSyncTimestamp(DateTime timestamp) async {
    try {
      await _userDataBox.put(_lastSyncKey, timestamp);
    } catch (e) {
      throw CacheException(
        message: 'Erreur lors de la sauvegarde du timestamp de sync',
        details: e,
      );
    }
  }

  /// Initialise les boxes Hive si nécessaire
  static Future<void> initialize() async {
    if (!Hive.isBoxOpen(_workoutBoxName)) {
      await Hive.openBox<WorkoutModel>(_workoutBoxName);
    }
    if (!Hive.isBoxOpen(_exerciseBoxName)) {
      await Hive.openBox<ExerciseModel>(_exerciseBoxName);
    }
    if (!Hive.isBoxOpen(_userDataBoxName)) {
      await Hive.openBox(_userDataBoxName);
    }
  }

  /// Ferme toutes les boxes Hive
  static Future<void> dispose() async {
    if (Hive.isBoxOpen(_workoutBoxName)) {
      await Hive.box<WorkoutModel>(_workoutBoxName).close();
    }
    if (Hive.isBoxOpen(_exerciseBoxName)) {
      await Hive.box<ExerciseModel>(_exerciseBoxName).close();
    }
    if (Hive.isBoxOpen(_userDataBoxName)) {
      await Hive.box(_userDataBoxName).close();
    }
  }
}