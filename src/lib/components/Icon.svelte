<script>
    const dataURL = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAoklEQVQ4T9WTgQ0AIQgDdTNHczQ381NjTcUywJOYzyOcBaUWb3O7q2zTB9fxawBjZ++9YBlD/AW3ACQSMMYoWGKErFwHgH+dohD8G5AFzNbaFZyosQqeZNUOUCipXl2OJyc3tErbqm4ApSY3cHoi+68CqMiMTdzfpwerfi2DsNB9NvgvgChfHtRbAl8fk9y1CtA/JEDYvAiIydks6NhmE3n8H+jEeRHyHrD+AAAAAElFTkSuQmCC";
    const displaySize = 16 / devicePixelRatio * 2;
</script>

<img 
    src={dataURL} 
    width=16 
    height=16 
    style:width={displaySize}px
    style:height={displaySize}px
    alt="trashcan"
>

<svelte:head>
    <link rel="icon" type="image/png" href={dataURL} />
</svelte:head>

<style>
    img {
        margin: 0;
    }
</style>