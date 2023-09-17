const jsdom = require("jsdom");

async function minifyContent(filepath, content) {
    try {
        if (filepath.endsWith(".java")) {
            return await minifyJava(content);
        } else if (filepath.endsWith(".js")) {
            return await minifyJs(content);
        } else if (filepath.endsWith(".vue")) {
            return await minifyVue(content);
        }
    } catch (err) {
        console.error(err);
    }
    return content;
}

async function minifyJava(content) {
    return content
        .replace(/package .*;\n?/g, '\n')
        .replace(/import .*;\n?/g, '\n')
        .replace(/(?:\/\*.*?\*\/)|\/\/.*/g, '')
        .replace(/\/\*(?:(?!\*\/)[\s\S])*\*\/|[\r\n\t]+/g, '')
        .replace(/(\s)(={1,3}|<|>|<=|>=|\+=|\+{1,3}|\-=|!=|!==|!===|\+|\?|\:|\|\||&{1,2}|\/)(\s)/g, '$2')
        .replace(/\s+(?=\()|\s+(?=\))|\s+(?=\{)|\s+(?=\})/g, '')
        .replace(/(\)|\(|\{|\})\s+/g, '$1')
        .replace(/ {2,}(?!["\s])/g, ' ')
        .replace(/ ([{:}]) /g, '$1')
        .replace(/([;,]) /g, '$1')
        .replace(/ !/g, '!')
        .replace(/] /g, ']')
        .replace(/( % )/g, '%')
        .replace(/: (?!["])/g, ':')
        .replace(/#([a-f0-9]+)\1([a-f0-9]+)\2([a-f0-9]+)\3/ig, '#$1$2$3')
        .replace(/\s\s/g, ' ');
}

async function minifyJs(content) {
    return (await minifyJava(content))
        .replaceAll(' :', ':')
        .replaceAll(': ', ':');
}

async function minifyHtml(content) {
    let minifier = await import("minify-xml");
    return minifier.minify(content, {
        trimWhitespaceFromTexts: true,
        collapseWhitespaceInTexts: true
    }).replaceAll('<br>', '');
}

async function minifyCss(content) {
    const postcss = await import('postcss');
    const cssnano = await import('cssnano');
    const litePreset = await import('cssnano-preset-lite');
    const autoprefixer = await import('autoprefixer');
    const preset = litePreset.default({ discardComments: true });
    const minifiedCss = postcss.default([cssnano.default({ preset, plugins: [autoprefixer.default] })]).process(content);
    return minifiedCss.css;
}

async function minifyVue(content) {
    const dom = new jsdom.JSDOM(`<content>${content}</content>`);

    const js = dom.window.document.querySelector("script").innerHTML;
    const template = dom.window.document.querySelector("template").outerHTML;
    const style = dom.window.document.querySelector("style").innerHTML;

    let miniTemplate = (await minifyHtml(template))
        // Add some vue templating optimizations to prevent some useless tokens
        .replaceAll('{{ ', '{{')
        .replaceAll(' }}', '}}')
        .replaceAll('> {{', '>{{')
        .replaceAll('}} <', '}}<')
        ;
    let miniScript = await minifyJs(js);
    let miniCss = await minifyCss(style);

    return `${miniTemplate}<script>${miniScript}</script><style>${miniCss}</style>`;
}

module.exports = {
    minifyContent
}