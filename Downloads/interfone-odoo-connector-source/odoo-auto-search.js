// Script à injecter dans Odoo pour automatiser la recherche de contacts
// Ce script s'exécute automatiquement quand Odoo est chargé

(function() {
    console.log('🔍 [INTERFONE] Script d\'auto-search chargé dans Odoo');

    // Fonction pour vérifier et exécuter via localStorage (ancienne méthode)
    function checkLocalStorage() {
        const searchScript = localStorage.getItem('interfone_search_script');
        const searchNumber = localStorage.getItem('interfone_search_number');

        console.log('🔍 [INTERFONE] localStorage check:', {
            hasScript: !!searchScript,
            hasNumber: !!searchNumber,
            number: searchNumber
        });

        if (searchScript && searchNumber) {
            console.log('🔍 [INTERFONE] Recherche automatique via localStorage pour:', searchNumber);

            // Nettoyer le localStorage
            localStorage.removeItem('interfone_search_script');
            localStorage.removeItem('interfone_search_number');

            executeSearchScript(searchScript);
            return true;
        }
        return false;
    }

    // Fonction pour vérifier et exécuter via URL (nouvelle méthode)
    function checkURLParams() {
        const urlParams = new URLSearchParams(window.location.hash.substring(1));
        const encodedScript = urlParams.get('interfone_script');
        const searchNumber = urlParams.get('interfone_number');

        console.log('🔍 [INTERFONE] URL params check:', {
            hasScript: !!encodedScript,
            hasNumber: !!searchNumber,
            number: searchNumber,
            currentHash: window.location.hash
        });

        if (encodedScript && searchNumber) {
            console.log('🔍 [INTERFONE] Recherche automatique via URL pour:', searchNumber);

            try {
                const searchScript = decodeURIComponent(encodedScript);
                console.log('🔍 [INTERFONE] Script décodé, longueur:', searchScript.length);
                executeSearchScript(searchScript);
                return true;
            } catch (error) {
                console.error('🔍 [INTERFONE] Erreur décodage script URL:', error);
            }
        }
        return false;
    }

    // Fonction pour exécuter le script de recherche
    function executeSearchScript(searchScript) {
        console.log('🔍 [INTERFONE] Exécution dans 3 secondes...');

        setTimeout(function() {
            console.log('🔍 [INTERFONE] Début exécution du script de recherche...');
            try {
                eval(searchScript);
            } catch (error) {
                console.error('🔍 [INTERFONE] Erreur lors de l\'exécution:', error);
            }
        }, 3000);
    }

    // Essayer les deux méthodes
    if (!checkURLParams() && !checkLocalStorage()) {
        console.log('🔍 [INTERFONE] Aucune recherche automatique demandée');
    }
})();