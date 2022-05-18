import { Directive, ViewContainerRef, TemplateRef, Input, 
    IterableDiffer, IterableDiffers, ChangeDetectorRef, IterableChangeRecord,
    ViewRef } from "@angular/core";

@Directive({
    selector: "[paForOf]"
})
export class PaIteratorDirective {
    private differ: IterableDiffer<any> | undefined;
    private views: Map<any, PaIteratorContext> = new Map<any, PaIteratorContext>();
    
    constructor(private container: ViewContainerRef,
        private template: TemplateRef<Object>, 
        private differs: IterableDiffers,
        private changeDetector: ChangeDetectorRef) { }

    @Input("paForOf")
    dataSource: any;

    ngOnInit() {
        this.differ = 
           <IterableDiffer<any>> this.differs.find(this.dataSource).create();
    }

    ngDoCheck() {
        let changes = this.differ?.diff(this.dataSource);
        if (changes != null) {
            let arr: IterableChangeRecord<any>[] = [];
            changes.forEachAddedItem(addition => arr.push(addition));
            arr.forEach(addition => {
                if (addition.currentIndex != null) {
                    let context = new PaIteratorContext(addition.item,
                        addition.currentIndex, arr.length);
                    context.view = this.container.createEmbeddedView(this.template,
                        context);
                    this.views.set(addition.trackById, context);
                }
            });
            let removals = false;
            changes.forEachRemovedItem(removal => {
                removals = true;
                let context = this.views.get(removal.trackById);
                if (context != null && context.view != null) {
                    this.container.remove(this.container.indexOf(context.view));
                    this.views.delete(removal.trackById);
                }
            });
            if (removals) {
                let index = 0;
                this.views.forEach(context =>
                    context.setData(index++, this.views.size));
            }
        }        
    }
}

class PaIteratorContext {
    index: number = 0;
    odd: boolean = false; even: boolean = false;
    first: boolean = false; last: boolean = false;
    view: ViewRef | undefined;

    constructor(public $implicit: any,
            public position: number, total: number ) {
        this.setData(position, total);
    }

    setData(index: number, total: number) {
        this.index = index;
        this.odd = index % 2 == 1;
        this.even = !this.odd;
        this.first = index == 0;
        this.last = index == total - 1;
    }
}
