import { Resource } from "./resource.mjs";

// export class Thing extends Resource {
//     constructor(name="thing") {
//         super(name, "thing");
//         this.name = name;
//     }
// }

export class Room extends Resource {
    constructor(name = "room", resourceManager = null) {
        super(name, resourceManager);
    }
}
