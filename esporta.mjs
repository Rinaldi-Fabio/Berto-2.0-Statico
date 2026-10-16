// Copia statica del sito Local (http://da-berto-20.local) per GitHub Pages. Legge solo via HTTP: WordPress non viene toccato.
// Uso (con il sito avviato in Local): node esporta.mjs   → poi git add -A, commit, push.
import { mkdir, writeFile, readdir, rm } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const SITE = 'http://da-berto-20.local';
const BASE_404 = '/Berto-2.0-Statico/'; // 404.html è servita a ogni profondità: lì servono indirizzi assoluti.
const OUT = dirname( fileURLToPath( import.meta.url ) );
const KEEP = new Set( [ '.git', '.nojekyll', 'esporta.mjs', 'README.md' ] );
const START = [ '/', '/menu/', '/storia/', '/prenota/', '/privacy/', '/cookie/' ];
const SKIP = /^\/(wp-json|wp-admin|wp-login|xmlrpc|feed|comments\/feed)|\/feed\/$/;

// Rimuove l'esportazione precedente.
for ( const f of await readdir( OUT ) ) if ( ! KEEP.has( f ) ) await rm( join( OUT, f ), { recursive: true } );

const pages = new Set( START ), assets = new Set(), done = new Set();
const isPage = ( p ) => p.endsWith( '/' ) || ! /\.[a-z0-9]+$/i.test( p );
const collect = ( text ) => {
	const found = [];
	for ( const m of text.matchAll( /http:(?:\\?\/){2}da-berto-20\.local((?:\\?\/)[^"'\s)<>,]*)?/g ) ) found.push( ( m[ 1 ] || '/' ).replace( /\\\//g, '/' ) );
	for ( const m of text.matchAll( /(?:src|href)="(\/[^/"][^"]*)"/g ) ) found.push( m[ 1 ] );
	for ( let p of found ) {
		p = p.split( '#' )[ 0 ];
		const path = p.split( '?' )[ 0 ];
		if ( ! path || SKIP.test( path ) ) continue;
		( isPage( path ) ? pages : assets ).add( isPage( path ) ? path : p );
	}
};
const save = async ( file, data ) => {
	await mkdir( dirname( join( OUT, file ) ), { recursive: true } );
	await writeFile( join( OUT, file ), data );
};
// Indirizzi del sito → relativi alla pagina (prefix = '../' per livello), così funziona sotto /Berto-2.0-Statico/.
const relink = ( html, prefix ) => html
	.replace( /((?:src|href)=")\/(?!\/)/g, `$1${ prefix || './' }` )
	.replace( /http:\\\/\\\/da-berto-20\.local\\\//g, prefix.replace( /\//g, '\\/' ) || '.\\/' )
	.replace( /http:\/\/da-berto-20\.local\/?/g, prefix || './' );
const clean = ( html ) => html
	.replace( /<link rel="(?:alternate|EditURI|https:\/\/api\.w\.org\/|shortlink|pingback|canonical)"[^>]*>\n?/g, '' )
	.replace( /<script type="speculationrules">[\s\S]*?<\/script>\n?/g, '' )
	.replace( /<meta name=['"]robots['"][^>]*>\n?/g, '' )
	.replace( /<head>/, '<head>\n<meta name="robots" content="noindex, nofollow">' );

async function page( path, file, prefix ) {
	const res = await fetch( SITE + path );
	const html = await res.text();
	collect( html );
	await save( file, relink( clean( html ), prefix ) );
	return res.status;
}

while ( [ ...pages ].some( ( p ) => ! done.has( p ) ) ) {
	for ( const p of [ ...pages ] ) {
		if ( done.has( p ) ) continue;
		done.add( p );
		const depth = p.split( '/' ).filter( Boolean ).length;
		const status = await page( p, join( p, 'index.html' ), '../'.repeat( depth ) );
		console.log( status, p );
	}
}
console.log( await page( '/pagina-che-non-esiste/', '404.html', BASE_404 ), '404.html' );

for ( const a of assets ) {
	const res = await fetch( SITE + a );
	if ( ! res.ok ) { console.log( res.status, a ); continue; }
	const path = a.split( '?' )[ 0 ];
	let data = Buffer.from( await res.arrayBuffer() );
	if ( path.endsWith( '.css' ) ) {
		const prefix = '../'.repeat( path.split( '/' ).filter( Boolean ).length - 1 );
		const css = data.toString();
		collect( css );
		data = relink( css, prefix );
	}
	await save( path, data );
}
console.log( `${ done.size } pagine + 404, ${ assets.size } file` );
