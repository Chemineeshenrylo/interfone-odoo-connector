/** @odoo-module **/

import { registry } from "@web/core/registry";

// Script Interfone Auto Search - Inspiré de calendar_activity_widget
console.log('🔍 [INTERFONE MODULE] Module de recherche automatique chargé');

// Fonction pour analyser l'URL et extraire les paramètres Interfone
function parseInterfoneURL() {
    const currentURL = decodeURIComponent(window.location.href);
    const hash = window.location.hash;

    console.log('🔍 [INTERFONE MODULE] URL décodée:', currentURL);

    // Vérifier s'il y a un fragment interfone (normal ou encodé) à la fin de l'URL
    let interfoneMatch = currentURL.match(/#interfone:([^#&?]+)/);
    if (!interfoneMatch) {
        // Essayer avec la version encodée %23interfone:
        interfoneMatch = currentURL.match(/%23interfone:([^#&?%]+)/);
    }

    const interfoneNumber = interfoneMatch ? interfoneMatch[1] : null;

    if (interfoneNumber) {
        console.log('🔍 [INTERFONE MODULE] Fragment interfone trouvé:', interfoneNumber);
    }

    // Parser les paramètres normaux d'Odoo
    const hashWithoutInterfone = hash.replace(/#interfone:[^#&?]+/, '').substring(1);
    const urlParams = new URLSearchParams(hashWithoutInterfone);

    return {
        model: urlParams.get('model'),
        viewType: urlParams.get('view_type'),
        interfoneNumber: interfoneNumber,
        isContactsList: urlParams.get('model') === 'res.partner' && urlParams.get('view_type') === 'list',
        fullURL: currentURL
    };
}

// Fonction principale pour exécuter la recherche automatique Interfone
async function performInterfoneSearch() {
    const urlInfo = parseInterfoneURL();

    console.log('🔍 [INTERFONE MODULE] Vérification URL:', urlInfo);

    // Ne traiter que si on est sur la liste des contacts ET qu'on a un numéro interfone
    if (urlInfo.isContactsList && urlInfo.interfoneNumber) {
        console.log('🔍 [INTERFONE MODULE] Fragment interfone détecté:', urlInfo.interfoneNumber);

        // Nettoyer l'URL en supprimant le fragment interfone
        const cleanUrl = window.location.href.replace(/#interfone:[^#&?]+/, '');
        window.history.replaceState(null, null, cleanUrl);
        console.log('🔍 [INTERFONE MODULE] Fragment interfone nettoyé de l\'URL');

        console.log('🔍 [INTERFONE MODULE] Lancement de la recherche automatique pour:', urlInfo.interfoneNumber);
        await executeSearch(urlInfo.interfoneNumber);
    }
}

// Fonction pour exécuter la recherche
async function executeSearch(phoneNumber) {
    console.log('🔍 [INTERFONE MODULE] Exécution de la recherche pour:', phoneNumber);

    try {
        // Attendre que les services Odoo soient disponibles
        await waitForOdooServices();

        const rpc = odoo.__WOWL_DEBUG__.root.env.services.rpc;
        const actionService = odoo.__WOWL_DEBUG__.root.env.services.action;

        if (!rpc || !actionService) {
            console.error('🔍 [INTERFONE MODULE] Services Odoo non disponibles');
            return;
        }

        console.log('🔍 [INTERFONE MODULE] Services Odoo détectés, lancement recherche RPC...');

        // Effectuer la recherche
        const partners = await rpc('/web/dataset/call_kw/res.partner/search_read', {
            model: 'res.partner',
            method: 'search_read',
            args: [[
                '|',
                ['phone', 'ilike', phoneNumber],
                ['mobile', 'ilike', phoneNumber]
            ]],
            kwargs: {
                fields: ['id', 'name', 'phone', 'mobile', 'email'],
                limit: 50
            }
        });

        console.log('🔍 [INTERFONE MODULE] Résultats:', partners.length, 'contacts trouvés');
        console.log('🔍 [INTERFONE MODULE] Détails:', partners);

        if (partners.length > 0) {
            // Contacts trouvés - Ouvrir la vue avec le filtre
            console.log('🔍 [INTERFONE MODULE] Ouverture vue filtrée avec', partners.length, 'contact(s) trouvé(s)');

            const action = {
                type: 'ir.actions.act_window',
                name: `Contacts Interfone: ${phoneNumber}`,
                res_model: 'res.partner',
                view_mode: 'list,form',
                views: [[false, 'list'], [false, 'form']],
                domain: [
                    '|',
                    ['phone', 'ilike', phoneNumber],
                    ['mobile', 'ilike', phoneNumber]
                ],
                context: {},
                target: 'current'
            };

            console.log('🔍 [INTERFONE MODULE] Action exécutée:', action);
            await actionService.doAction(action);

        } else {
            // Aucun contact trouvé - Rester sur la liste normale des contacts
            console.log('🔍 [INTERFONE MODULE] Aucun contact trouvé pour le numéro:', phoneNumber);
            console.log('🔍 [INTERFONE MODULE] Affichage de la liste normale des contacts (pas de création automatique)');

            // Optionnel : Afficher une notification
            if (typeof odoo !== 'undefined' && odoo.__WOWL_DEBUG__ && odoo.__WOWL_DEBUG__.root.env.services.notification) {
                const notificationService = odoo.__WOWL_DEBUG__.root.env.services.notification;
                notificationService.add(`Aucun contact trouvé pour le numéro ${phoneNumber}`, {
                    type: 'info',
                    title: 'Recherche Interfone'
                });
            }
        }

    } catch (error) {
        console.error('🔍 [INTERFONE MODULE] Erreur lors de la recherche:', error);
    }
}

// Fonction pour attendre que les services Odoo soient prêts
function waitForOdooServices() {
    return new Promise((resolve) => {
        function check() {
            if (typeof odoo !== 'undefined' &&
                odoo.__WOWL_DEBUG__ &&
                odoo.__WOWL_DEBUG__.root &&
                odoo.__WOWL_DEBUG__.root.env.services.rpc &&
                odoo.__WOWL_DEBUG__.root.env.services.action) {
                console.log('🔍 [INTERFONE MODULE] Services Odoo prêts');
                resolve();
            } else {
                console.log('🔍 [INTERFONE MODULE] Attente services Odoo...');
                setTimeout(check, 500);
            }
        }
        check();
    });
}

// Surveillance des changements d'URL (comme dans votre calendar widget)
let lastURL = window.location.href;
let urlChangeTimer = null;

function watchURLChanges() {
    const currentURL = window.location.href;

    if (currentURL !== lastURL) {
        lastURL = currentURL;

        console.log('🔍 [INTERFONE MODULE] Changement URL détecté:', currentURL);

        // Débounce pour éviter les appels trop fréquents
        clearTimeout(urlChangeTimer);
        urlChangeTimer = setTimeout(() => {
            performInterfoneSearch();
        }, 100);
    }
}

// Démarrer la surveillance des changements d'URL
console.log('🔍 [INTERFONE MODULE] Démarrage surveillance URL...');
setInterval(watchURLChanges, 1000);

// Vérification immédiate et répétée au chargement
console.log('🔍 [INTERFONE MODULE] Vérification immédiate...');
performInterfoneSearch();

// Vérifications supplémentaires pendant le chargement
setTimeout(() => {
    console.log('🔍 [INTERFONE MODULE] Vérification après 500ms...');
    performInterfoneSearch();
}, 500);

setTimeout(() => {
    console.log('🔍 [INTERFONE MODULE] Vérification après 1000ms...');
    performInterfoneSearch();
}, 1000);

setTimeout(() => {
    console.log('🔍 [INTERFONE MODULE] Vérification après 2000ms...');
    performInterfoneSearch();
}, 2000);

setTimeout(() => {
    console.log('🔍 [INTERFONE MODULE] Vérification après 3000ms...');
    performInterfoneSearch();
}, 3000);

// Écouter les changements d'URL (navigation programmatique)
window.addEventListener('popstate', () => {
    console.log('🔍 [INTERFONE MODULE] Popstate détecté, vérification...');
    setTimeout(performInterfoneSearch, 100);
});

// Écouter les changements de hash
window.addEventListener('hashchange', () => {
    console.log('🔍 [INTERFONE MODULE] Hash change détecté, vérification...');
    setTimeout(performInterfoneSearch, 100);
});

// Alternative: Delegation d'événements globale pour intercepter les navigations
document.addEventListener('click', function(event) {
    setTimeout(() => {
        performInterfoneSearch();
    }, 500);
}, true);

console.log('🔍 [INTERFONE MODULE] Module initialisé avec surveillance URL complète');