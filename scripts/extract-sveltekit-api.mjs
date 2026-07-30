// Extracts every module, class, interface, type, function, const and property
// (including nested object-literal properties) from the SvelteKit .d.ts bundle,
// together with its JSDoc description, @default / @since / @deprecated tags.
import fs from 'node:fs';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';

// resolve `typescript` from the project passed as argv[2] rather than from this script's location
const require = createRequire(pathToFileURL(process.argv[2] + '/'));
const ts = require('typescript');

const SOURCES = process.argv.slice(4);
const OUT = process.argv[3];

/* ------------------------------------------------------------------ jsdoc */

function commentToString(c) {
	if (!c) return '';
	if (typeof c === 'string') return c;
	return c
		.map((p) => {
			switch (p.kind) {
				case ts.SyntaxKind.JSDocLink:
				case ts.SyntaxKind.JSDocLinkCode:
				case ts.SyntaxKind.JSDocLinkPlain: {
					const name = p.name ? p.name.getText() : '';
					return (name + ' ' + (p.text || '')).trim();
				}
				default:
					return p.text || '';
			}
		})
		.join('');
}

function getDoc(node) {
	const jsDoc = node.jsDoc;
	const out = { description: '', since: '', default: '', deprecated: null, params: [], example: '' };
	if (!jsDoc || !jsDoc.length) return out;
	const doc = jsDoc[jsDoc.length - 1];
	out.description = commentToString(doc.comment).trim();
	for (const tag of doc.tags || []) {
		const name = tag.tagName.getText();
		const text = commentToString(tag.comment).trim();
		if (name === 'since') out.since = text;
		else if (name === 'default') out.default = text;
		else if (name === 'deprecated') out.deprecated = text || '(no reason given)';
		else if (name === 'param') {
			const pn = tag.name ? tag.name.getText() : '';
			if (pn) out.params.push({ name: pn, text });
		} else if (name === 'example') out.example = text;
	}
	return out;
}

/* ------------------------------------------------------------------ types */

function typeText(node, sf) {
	if (!node) return 'any';
	return node.getText(sf).replace(/[\t ]*\r?\n[\t ]*/g, ' ').replace(/\s{2,}/g, ' ').trim();
}

function code(t) {
	// inline code; fall back to a fenced block for very long signatures
	if (t.length > 220) return '\n\n  ```ts\n  ' + t + '\n  ```\n';
	return '`' + t.replace(/`/g, "'") + '`';
}

/* ------------------------------------------------------------------ render */

const lines = [];
const index = []; // { name, kind, module }

function w(s = '') {
	lines.push(s);
}

function renderDocBody(doc, indent) {
	const pad = ' '.repeat(indent);
	const bits = [];
	if (doc.deprecated) bits.push(`${pad}> **Deprecated** — ${doc.deprecated}`);
	if (doc.description) {
		bits.push(
			doc.description
				.split('\n')
				.map((l) => pad + l)
				.join('\n')
		);
	}
	if (doc.default) bits.push(`${pad}Default: \`${doc.default}\``);
	if (doc.since) bits.push(`${pad}_Available since ${doc.since}_`);
	for (const p of doc.params) bits.push(`${pad}- \`${p.name}\` — ${p.text}`);
	return bits;
}

// Recursively list the members of an interface / class / type-literal.
function renderMembers(members, sf, prefix, depth) {
	const indent = '  '.repeat(depth);
	for (const m of members) {
		let name;
		let sig;
		let nested = null;

		const q = m.questionToken ? '?' : '';

		switch (m.kind) {
			case ts.SyntaxKind.PropertySignature:
			case ts.SyntaxKind.PropertyDeclaration: {
				name = m.name.getText(sf);
				if (m.type && ts.isTypeLiteralNode(m.type)) {
					nested = m.type.members;
					sig = '{ … }';
				} else {
					sig = typeText(m.type, sf);
				}
				break;
			}
			case ts.SyntaxKind.MethodSignature:
			case ts.SyntaxKind.MethodDeclaration: {
				name = m.name.getText(sf);
				const params = m.parameters.map((p) => p.getText(sf)).join(', ');
				sig = `(${params}) => ${typeText(m.type, sf)}`;
				break;
			}
			case ts.SyntaxKind.Constructor: {
				name = 'constructor';
				sig = `(${m.parameters.map((p) => p.getText(sf)).join(', ')})`;
				break;
			}
			case ts.SyntaxKind.GetAccessor: {
				name = m.name.getText(sf);
				sig = `get → ${typeText(m.type, sf)}`;
				break;
			}
			case ts.SyntaxKind.SetAccessor: {
				name = m.name.getText(sf);
				sig = `set(${m.parameters.map((p) => p.getText(sf)).join(', ')})`;
				break;
			}
			case ts.SyntaxKind.IndexSignature: {
				name = `[${m.parameters.map((p) => p.getText(sf)).join(', ')}]`;
				sig = typeText(m.type, sf);
				break;
			}
			case ts.SyntaxKind.CallSignature: {
				name = '(call)';
				sig = `(${m.parameters.map((p) => p.getText(sf)).join(', ')}) => ${typeText(m.type, sf)}`;
				break;
			}
			default:
				continue;
		}

		const doc = getDoc(m);
		const path = prefix ? `${prefix}.${name}` : name;
		w(`${indent}- **\`${path}${q}\`**: ${code(sig)}`);
		const body = renderDocBody(doc, indent.length + 2);
		if (body.length) {
			w('');
			for (const b of body) w(b);
			w('');
		}
		if (nested) renderMembers(nested, sf, path, depth + 1);
	}
}

function renderDeclaration(node, sf, moduleName) {
	const doc = getDoc(node);

	const heading = (kind, name, extra = '') => {
		w('');
		w(`#### \`${name}\` — ${kind}${extra}`);
		w('');
		const body = renderDocBody(doc, 0);
		for (const b of body) w(b);
		if (body.length) w('');
		index.push({ name, kind, module: moduleName });
	};

	const typeParams = (n) =>
		n.typeParameters ? `<${n.typeParameters.map((p) => p.getText(sf)).join(', ')}>` : '';

	if (ts.isInterfaceDeclaration(node)) {
		const ext = node.heritageClauses
			? ' ' + node.heritageClauses.map((h) => h.getText(sf)).join(' ')
			: '';
		heading('interface', node.name.getText(sf) + typeParams(node), ext ? ` — ${ext.trim()}` : '');
		renderMembers(node.members, sf, '', 0);
		return true;
	}

	if (ts.isClassDeclaration(node) && node.name) {
		heading('class', node.name.getText(sf) + typeParams(node));
		renderMembers(node.members, sf, '', 0);
		return true;
	}

	if (ts.isTypeAliasDeclaration(node)) {
		heading('type', node.name.getText(sf) + typeParams(node));
		if (ts.isTypeLiteralNode(node.type)) {
			renderMembers(node.type.members, sf, '', 0);
		} else {
			const t = typeText(node.type, sf);
			w(t.length > 200 ? '```ts\n' + node.type.getText(sf) + '\n```' : `Type: ${code(t)}`);
			w('');
		}
		return true;
	}

	if (ts.isFunctionDeclaration(node) && node.name) {
		const params = node.parameters.map((p) => typeText(p, sf)).join(', ');
		heading('function', node.name.getText(sf) + typeParams(node));
		w(`Signature: ${code(`(${params}) => ${typeText(node.type, sf)}`)}`);
		w('');
		return true;
	}

	if (ts.isVariableStatement(node)) {
		for (const d of node.declarationList.declarations) {
			const name = d.name.getText(sf);
			const kw = node.declarationList.flags & ts.NodeFlags.Const ? 'const' : 'let';
			heading(kw, name);
			if (d.type && ts.isTypeLiteralNode(d.type)) {
				renderMembers(d.type.members, sf, '', 0);
			} else {
				w(`Type: ${code(typeText(d.type, sf))}`);
				w('');
			}
		}
		return true;
	}

	if (ts.isEnumDeclaration(node)) {
		heading('enum', node.name.getText(sf));
		for (const m of node.members) {
			const md = getDoc(m);
			w(`- **\`${m.name.getText(sf)}\`**${m.initializer ? ' = `' + m.initializer.getText(sf) + '`' : ''}`);
			for (const b of renderDocBody(md, 2)) w(b);
		}
		w('');
		return true;
	}

	if (ts.isModuleDeclaration(node) && node.body && ts.isModuleBlock(node.body)) {
		// nested namespace (e.g. `namespace App`)
		const nsName = node.name.getText(sf).replace(/^['"]|['"]$/g, '');
		w('');
		w(`### namespace \`${nsName}\``);
		w('');
		for (const b of renderDocBody(doc, 0)) w(b);
		w('');
		for (const s of node.body.statements) renderDeclaration(s, sf, `${moduleName} › ${nsName}`);
		return true;
	}

	return false;
}

/* ------------------------------------------------------------------ drive */

const moduleSections = [];

for (const file of SOURCES) {
	const text = fs.readFileSync(file, 'utf8');
	const sf = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);

	for (const stmt of sf.statements) {
		if (
			ts.isModuleDeclaration(stmt) &&
			ts.isStringLiteral(stmt.name) &&
			stmt.body &&
			ts.isModuleBlock(stmt.body)
		) {
			const moduleName = stmt.name.text;
			const start = lines.length;
			w('');
			w('---');
			w('');
			w(`### Module: \`${moduleName}\``);
			w('');
			for (const s of stmt.body.statements) renderDeclaration(s, sf, moduleName);
			moduleSections.push(moduleName);
			if (lines.length === start) lines.length = start;
		} else if (
			ts.isModuleDeclaration(stmt) &&
			!ts.isStringLiteral(stmt.name) &&
			stmt.body &&
			ts.isModuleBlock(stmt.body)
		) {
			// top-level `declare namespace App`
			const nsName = stmt.name.getText(sf);
			w('');
			w('---');
			w('');
			w(`### Namespace: \`${nsName}\``);
			w('');
			for (const b of renderDocBody(getDoc(stmt), 0)) w(b);
			w('');
			for (const s of stmt.body.statements) renderDeclaration(s, sf, nsName);
			moduleSections.push(nsName);
		}
	}
}

/* ------------------------------------------------------------- assemble */

const header = [];
header.push('# SvelteKit — Complete API Reference (generated)');
header.push('');
header.push(
	`Every module, class, interface, type, function, constant and property exported by SvelteKit, with its description.`
);
header.push('');
header.push('## Modules covered');
header.push('');
for (const m of moduleSections) header.push(`- \`${m}\``);
header.push('');
header.push('## Alphabetical index');
header.push('');
const seen = new Set();
for (const e of [...index].sort((a, b) => a.name.localeCompare(b.name))) {
	const key = `${e.module}::${e.name}`;
	if (seen.has(key)) continue;
	seen.add(key);
	header.push(`- \`${e.name}\` — *${e.kind}* — \`${e.module}\``);
}

fs.writeFileSync(OUT, header.concat(lines).join('\n'), 'utf8');
console.error(
	`modules=${moduleSections.length} symbols=${index.length} lines=${header.length + lines.length}`
);
