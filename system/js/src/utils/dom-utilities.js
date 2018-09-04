export let isInputOrTextarea = (input) => {
    return  input && input.tagName && 
            ((input.tagName.toLowerCase() === "textarea") ||
                input.tagName.toLowerCase() === "input" && input.type.toLowerCase() === "text");
}

export let isHtmlNode = (input) => {
    return typeof HTMLElement === "object" ? 
            id instanceof HTMLElement : 
            typeof id === "object" && id.nodeType === 1 && typeof id.nodeName === "string";
}

export let addEventLnr = (obj, type, fn) => {
    if (window.attachEvent) {
        obj["e" + type + fn] = fn;
        obj[type + fn] = function () { obj["e" + type + fn](window.event); };
        obj.attachEvent("on" + type, obj[type + fn]);
    } else {
        obj.addEventListener(type, fn, false);
    }
};

export let addEventDsptchr = (eName) => { 
    if (window.Event && typeof window.Event === "function") {
        return new Event(eName);
    } else {
        let event = document.createEvent('Event');
        event.initEvent(eName, true, true);
        return event;
    }
};

