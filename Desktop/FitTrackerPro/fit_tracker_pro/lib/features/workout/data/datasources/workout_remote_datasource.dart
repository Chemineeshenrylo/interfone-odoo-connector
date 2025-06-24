import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:fit_tracker_pro/core/errors/exceptions.dart';
import '../models/workout_model.dart';
import '../models/exercise_model.dart';

/// Interface pour l'accès aux données distantes des workouts
/// 
/// Définit le contrat pour la persistance cloud avec Firebase Firestore.
abstract class WorkoutRemoteDataSource {
  /// Récupère tous les workouts de l'utilisateur depuis Firebase
  Future<List<WorkoutModel>> getRemoteWorkouts();

  /// Récupère un workout par son ID depuis Firebase
  Future<WorkoutModel> getRemoteWorkoutById(String id);

  /// Crée un nouveau workout sur Firebase
  Future<WorkoutModel> createRemoteWorkout(WorkoutModel workout);

  /// Met à jour un workout sur Firebase
  Future<WorkoutModel> updateRemoteWorkout(WorkoutModel workout);

  /// Supprime un workout de Firebase
  Future<void> deleteRemoteWorkout(String id);

  /// Récupère les workouts par statut
  Future<List<WorkoutModel>> getRemoteWorkoutsByStatus(String status);

  /// Récupère les workouts dans une plage de dates
  Future<List<WorkoutModel>> getRemoteWorkoutsByDateRange(
    DateTime startDate,
    DateTime endDate,
  );

  /// Recherche des workouts par nom
  Future<List<WorkoutModel>> searchRemoteWorkouts(String query);

  /// Récupère les templates
  Future<List<WorkoutModel>> getRemoteTemplates();

  /// Récupère tous les exercices depuis Firebase
  Future<List<ExerciseModel>> getRemoteExercises();

  /// Crée un exercice personnalisé
  Future<ExerciseModel> createRemoteExercise(ExerciseModel exercise);

  /// Met à jour un exercice personnalisé
  Future<ExerciseModel> updateRemoteExercise(ExerciseModel exercise);

  /// Supprime un exercice personnalisé
  Future<void> deleteRemoteExercise(String id);

  /// Synchronise les données avec le serveur
  Future<Map<String, dynamic>> syncWithServer({
    DateTime? lastSyncTimestamp,
  });
}

/// Implémentation Firebase du datasource distant
class WorkoutRemoteDataSourceImpl implements WorkoutRemoteDataSource {
  final FirebaseFirestore _firestore;
  final FirebaseAuth _auth;

  WorkoutRemoteDataSourceImpl({
    FirebaseFirestore? firestore,
    FirebaseAuth? auth,
  })  : _firestore = firestore ?? FirebaseFirestore.instance,
        _auth = auth ?? FirebaseAuth.instance;

  /// Collection des workouts pour l'utilisateur actuel
  CollectionReference get _workoutsCollection {
    final userId = _getCurrentUserId();
    return _firestore
        .collection('users')
        .doc(userId)
        .collection('workouts');
  }

  /// Collection des exercices pour l'utilisateur actuel
  CollectionReference get _exercisesCollection {
    final userId = _getCurrentUserId();
    return _firestore
        .collection('users')
        .doc(userId)
        .collection('exercises');
  }

  /// Collection globale des exercices prédéfinis
  CollectionReference get _globalExercisesCollection {
    return _firestore.collection('global_exercises');
  }

  @override
  Future<List<WorkoutModel>> getRemoteWorkouts() async {
    try {
      final querySnapshot = await _workoutsCollection
          .orderBy('created_at', descending: true)
          .get();

      return querySnapshot.docs
          .map((doc) => WorkoutModel.fromJson({
                'id': doc.id,
                ...doc.data() as Map<String, dynamic>,
              }))
          .toList();
    } on FirebaseException catch (e) {
      throw ServerException(
        message: 'Erreur lors de la récupération des workouts: ${e.message}',
        code: e.code,
      );
    } catch (e) {
      throw ServerException(
        message: 'Erreur inattendue lors de la récupération des workouts: $e',
      );
    }
  }

  @override
  Future<WorkoutModel> getRemoteWorkoutById(String id) async {
    try {
      final docSnapshot = await _workoutsCollection.doc(id).get();
      
      if (!docSnapshot.exists) {
        throw const ServerException(
          message: 'Workout non trouvé',
          code: 'not-found',
        );
      }

      return WorkoutModel.fromJson({
        'id': docSnapshot.id,
        ...docSnapshot.data() as Map<String, dynamic>,
      });
    } on FirebaseException catch (e) {
      throw ServerException(
        message: 'Erreur lors de la récupération du workout: ${e.message}',
        code: e.code,
      );
    } catch (e) {
      throw ServerException(
        message: 'Erreur inattendue lors de la récupération du workout: $e',
      );
    }
  }

  @override
  Future<WorkoutModel> createRemoteWorkout(WorkoutModel workout) async {
    try {
      final workoutData = workout.toJson();
      workoutData.remove('id'); // Firestore génère l'ID

      final docRef = await _workoutsCollection.add(workoutData);
      
      return workout.copyWith(id: docRef.id);
    } on FirebaseException catch (e) {
      throw ServerException(
        message: 'Erreur lors de la création du workout: ${e.message}',
        code: e.code,
      );
    } catch (e) {
      throw ServerException(
        message: 'Erreur inattendue lors de la création du workout: $e',
      );
    }
  }

  @override
  Future<WorkoutModel> updateRemoteWorkout(WorkoutModel workout) async {
    try {
      final workoutData = workout.toJson();
      workoutData.remove('id');

      await _workoutsCollection.doc(workout.id).update(workoutData);
      
      return workout;
    } on FirebaseException catch (e) {
      throw ServerException(
        message: 'Erreur lors de la mise à jour du workout: ${e.message}',
        code: e.code,
      );
    } catch (e) {
      throw ServerException(
        message: 'Erreur inattendue lors de la mise à jour du workout: $e',
      );
    }
  }

  @override
  Future<void> deleteRemoteWorkout(String id) async {
    try {
      await _workoutsCollection.doc(id).delete();
    } on FirebaseException catch (e) {
      throw ServerException(
        message: 'Erreur lors de la suppression du workout: ${e.message}',
        code: e.code,
      );
    } catch (e) {
      throw ServerException(
        message: 'Erreur inattendue lors de la suppression du workout: $e',
      );
    }
  }

  @override
  Future<List<WorkoutModel>> getRemoteWorkoutsByStatus(String status) async {
    try {
      final querySnapshot = await _workoutsCollection
          .where('status', isEqualTo: status)
          .orderBy('created_at', descending: true)
          .get();

      return querySnapshot.docs
          .map((doc) => WorkoutModel.fromJson({
                'id': doc.id,
                ...doc.data() as Map<String, dynamic>,
              }))
          .toList();
    } on FirebaseException catch (e) {
      throw ServerException(
        message: 'Erreur lors de la récupération des workouts par statut: ${e.message}',
        code: e.code,
      );
    }
  }

  @override
  Future<List<WorkoutModel>> getRemoteWorkoutsByDateRange(
    DateTime startDate,
    DateTime endDate,
  ) async {
    try {
      final querySnapshot = await _workoutsCollection
          .where('scheduled_at', isGreaterThanOrEqualTo: Timestamp.fromDate(startDate))
          .where('scheduled_at', isLessThanOrEqualTo: Timestamp.fromDate(endDate))
          .orderBy('scheduled_at')
          .get();

      return querySnapshot.docs
          .map((doc) => WorkoutModel.fromJson({
                'id': doc.id,
                ...doc.data() as Map<String, dynamic>,
              }))
          .toList();
    } on FirebaseException catch (e) {
      throw ServerException(
        message: 'Erreur lors de la récupération des workouts par plage de dates: ${e.message}',
        code: e.code,
      );
    }
  }

  @override
  Future<List<WorkoutModel>> searchRemoteWorkouts(String query) async {
    try {
      // Firebase n'a pas de recherche textuelle native, donc on récupère tout et filtre localement
      final allWorkouts = await getRemoteWorkouts();
      final lowerQuery = query.toLowerCase();
      
      return allWorkouts.where((workout) =>
          workout.name.toLowerCase().contains(lowerQuery) ||
          (workout.description?.toLowerCase().contains(lowerQuery) ?? false) ||
          workout.tags.any((tag) => tag.toLowerCase().contains(lowerQuery))
      ).toList();
    } catch (e) {
      throw ServerException(
        message: 'Erreur lors de la recherche de workouts: $e',
      );
    }
  }

  @override
  Future<List<WorkoutModel>> getRemoteTemplates() async {
    try {
      final querySnapshot = await _workoutsCollection
          .where('is_template', isEqualTo: true)
          .orderBy('created_at', descending: true)
          .get();

      return querySnapshot.docs
          .map((doc) => WorkoutModel.fromJson({
                'id': doc.id,
                ...doc.data() as Map<String, dynamic>,
              }))
          .toList();
    } on FirebaseException catch (e) {
      throw ServerException(
        message: 'Erreur lors de la récupération des templates: ${e.message}',
        code: e.code,
      );
    }
  }

  @override
  Future<List<ExerciseModel>> getRemoteExercises() async {
    try {
      // Récupère les exercices globaux et personnalisés
      final globalFuture = _globalExercisesCollection.get();
      final customFuture = _exercisesCollection.get();

      final results = await Future.wait([globalFuture, customFuture]);
      
      final allExercises = <ExerciseModel>[];
      
      // Exercices globaux
      allExercises.addAll(
        results[0].docs.map((doc) => ExerciseModel.fromJson({
          'id': doc.id,
          ...doc.data() as Map<String, dynamic>,
        })),
      );
      
      // Exercices personnalisés
      allExercises.addAll(
        results[1].docs.map((doc) => ExerciseModel.fromJson({
          'id': doc.id,
          ...doc.data() as Map<String, dynamic>,
        })),
      );

      return allExercises;
    } on FirebaseException catch (e) {
      throw ServerException(
        message: 'Erreur lors de la récupération des exercices: ${e.message}',
        code: e.code,
      );
    }
  }

  @override
  Future<ExerciseModel> createRemoteExercise(ExerciseModel exercise) async {
    try {
      final exerciseData = exercise.toJson();
      exerciseData.remove('id');

      final docRef = await _exercisesCollection.add(exerciseData);
      
      return exercise.copyWith(id: docRef.id);
    } on FirebaseException catch (e) {
      throw ServerException(
        message: 'Erreur lors de la création de l\'exercice: ${e.message}',
        code: e.code,
      );
    }
  }

  @override
  Future<ExerciseModel> updateRemoteExercise(ExerciseModel exercise) async {
    try {
      final exerciseData = exercise.toJson();
      exerciseData.remove('id');

      await _exercisesCollection.doc(exercise.id).update(exerciseData);
      
      return exercise;
    } on FirebaseException catch (e) {
      throw ServerException(
        message: 'Erreur lors de la mise à jour de l\'exercice: ${e.message}',
        code: e.code,
      );
    }
  }

  @override
  Future<void> deleteRemoteExercise(String id) async {
    try {
      await _exercisesCollection.doc(id).delete();
    } on FirebaseException catch (e) {
      throw ServerException(
        message: 'Erreur lors de la suppression de l\'exercice: ${e.message}',
        code: e.code,
      );
    }
  }

  @override
  Future<Map<String, dynamic>> syncWithServer({
    DateTime? lastSyncTimestamp,
  }) async {
    try {
      final syncData = <String, dynamic>{};
      
      if (lastSyncTimestamp != null) {
        // Synchronisation incrémentale
        final workoutsQuery = _workoutsCollection
            .where('updated_at', isGreaterThan: Timestamp.fromDate(lastSyncTimestamp));
        final exercisesQuery = _exercisesCollection
            .where('updated_at', isGreaterThan: Timestamp.fromDate(lastSyncTimestamp));

        final results = await Future.wait([
          workoutsQuery.get(),
          exercisesQuery.get(),
        ]);

        syncData['workouts'] = results[0].docs.map((doc) => {
          'id': doc.id,
          ...doc.data() as Map<String, dynamic>,
        }).toList();

        syncData['exercises'] = results[1].docs.map((doc) => {
          'id': doc.id,
          ...doc.data() as Map<String, dynamic>,
        }).toList();
      } else {
        // Synchronisation complète
        syncData['workouts'] = (await getRemoteWorkouts()).map((w) => w.toJson()).toList();
        syncData['exercises'] = (await getRemoteExercises()).map((e) => e.toJson()).toList();
      }

      syncData['sync_timestamp'] = DateTime.now().toIso8601String();
      
      return syncData;
    } catch (e) {
      throw ServerException(
        message: 'Erreur lors de la synchronisation: $e',
      );
    }
  }

  /// Récupère l'ID de l'utilisateur connecté
  String _getCurrentUserId() {
    final user = _auth.currentUser;
    if (user == null) {
      throw const ServerException(
        message: 'Aucun utilisateur connecté',
        code: 'unauthenticated',
      );
    }
    return user.uid;
  }
}