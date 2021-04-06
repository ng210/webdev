(function() {
    var html = self.Html || {};
    html.Entities = {
        'nbsp': ' ',
        'lt': '<',
        'gt': '>',
        'amp': '&' ,
        'quot': '"',
        'apos': "'",
        'tab': "    "
    };
    html.decode = function decodeHtml(html) {
        var text = [];
        for (var i=0; i<html.length; i++) {
            var ch = html.charAt(i);
            if (ch == '<') {
                var end = html.indexOf('>', i);
                var token = html.substring(i, end);
                if (token.match(/\s*br\s*\//) != null) {
                    text.push('\n');
                }
                i = end;
            } else if (ch == '&') {
                var end = html.indexOf(';', i);
                var token = html.substring(i+1, end);
                if (Html.Entities[token]) {
                    text.push(Html.Entities[token]);
                    i = end;
                } else {
                    text.push(ch);
                }
            } else text.push(ch);
        }
        return text.join('');
    };

    html.encode = function encodeHtml(text) {
        var html = [];
        for (var i=0; i<text.length; i++) {
            var ch = text.charAt(i);
            if (ch == '\n') {
                ch = '<br/>';
            } else {
                for (var e in Html.Entities) {
                    if (Html.Entities[e] == ch) {
                        ch = `&${e};`;
                        break;
                    }
                }
            }
            html.push(ch);
        }
        return html.join('');
    };
    publish(html, 'Html');
})();