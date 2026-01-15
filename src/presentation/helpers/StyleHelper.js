// Stil yönetim yardımcısı
export class StyleHelper {
    static applyConditional(widget, className, condition) {
        if (condition) {
            widget.add_style_class_name(className);
        } else {
            widget.remove_style_class_name(className);
        }
    }

    static updateStyles(widget, styleMap) {
        for (const [className, condition] of Object.entries(styleMap)) {
            this.applyConditional(widget, className, condition);
        }
    }
}
