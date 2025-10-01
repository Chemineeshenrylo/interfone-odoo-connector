{
    'name': 'Interfone Auto Search',
    'version': '17.0.1.0.0',
    'depends': ['base', 'contacts'],
    'data': [],
    'assets': {
        'web.assets_backend': [
            'interfone_search_module/static/src/js/interfone_auto_search.js',
        ],
    },
    'installable': True,
    'auto_install': False,
    'application': False,
}