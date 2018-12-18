#!/usr/bin/env node
"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var fs_1 = __importDefault(require("fs"));
var os_1 = __importDefault(require("os"));
var glob_1 = __importDefault(require("glob"));
var xml2js_1 = require("xml2js");
var lodash_1 = require("lodash");
if (process.argv.length <= 2) {
    console.log('Usage: ' + __filename + ' path/to/directory');
    process.exit(-1);
}
var path = process.argv[2];
var builder = new xml2js_1.Builder();
glob_1.default('**/*.component.ts', {
    cwd: path,
    nodir: true
}, function (err, files) {
    glob_1.default('WebStorm*', {
        cwd: os_1.default.homedir + '/Library/Preferences'
    }, function (err, folders) {
        if (folders.length < 1) {
            console.log('No WebStorm installation found');
            process.exit(-1);
        }
        var wsInstall = os_1.default.homedir + '/Library/Preferences/' + folders.sort().reverse().shift();
        var templates = [];
        var templateValues = {
            name: '',
            value: '',
            description: '',
            toReformat: 'false',
            toShortenFQNames: 'true'
        };
        var template = {
            '$': templateValues,
            context: [
                {
                    '$': {
                        name: 'JAVA_SCRIPT',
                        value: true
                    }
                }
            ]
        };
        var wsTemplate = {
            templateSet: {
                '$': {
                    group: 'Angular Components'
                },
                template: new Array
            }
        };
        try {
            xml2js_1.parseString(fs_1.default.readFileSync(wsInstall + '/templates/Angular-Components.xml', 'utf8'), function (err, result) {
                if (!lodash_1.isEmpty(result))
                    wsTemplate = result;
            });
        }
        catch (e) {
            console.log('\x1b[33m%s\x1b[0m', 'Could not open snippet file. Creating new one');
            if (!fs_1.default.existsSync(wsInstall + '/templates')) {
                fs_1.default.mkdirSync(wsInstall + '/templates');
            }
        }
        files.forEach(function (file) {
            var fileData = fs_1.default.readFileSync(path + '/' + file, 'utf8');
            var selectorRegex = /selector:\s\'(.*?)\'/g;
            var selectorMatch = selectorRegex.exec(fileData);
            if (selectorMatch !== null) {
                var selector = selectorMatch[1];
                var templateString = '';
                templateString = templateString + '&lt;' + selector.trim();
                +'&#10;';
                var inputRegex = /\@Input\(\)\n(.*?)(:|\s\=)/g;
                var inputs = void 0;
                while ((inputs = inputRegex.exec(fileData)) !== null) {
                    templateString = templateString + '\t[' + inputs[1].trim() + ']=&quot;&quot;&#10;';
                }
                var outputRegex = /\@Output\(\)\n(.*?)(:|\s\=)/g;
                var outputs = void 0;
                while ((outputs = outputRegex.exec(fileData)) !== null) {
                    templateString = templateString + '\t(' + outputs[1].trim() + ')=&quot;&quot;&#10;';
                }
                templateString = templateString + '&gt;&#10;&lt;/' + selector.trim() + '&gt;';
                var createdTemplateValues = __assign({}, templateValues, { name: selector.trim(), value: templateString, description: selector.trim() + ' snippet' });
                var createdTemplate = __assign({}, template, { '$': createdTemplateValues });
                wsTemplate.templateSet.template = wsTemplate.templateSet.template.concat([
                    createdTemplate
                ]);
            }
        });
        fs_1.default.writeFile(wsInstall + '/templates/Angular-Components.xml', builder.buildObject(wsTemplate), function (err) {
            if (err)
                throw err;
        });
        console.log('\x1b[32m%s\x1b[0m', 'Successfully generated snippet.');
    });
});
