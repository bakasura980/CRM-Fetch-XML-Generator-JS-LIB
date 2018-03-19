//#region QueryGenerator
function QueryGenerator(entity){
 
    let queryTemplate = "";
    this.RetrievedRecords = {
        count: 0,
        page: 1,
        getTemplatePlaceHolder: function(){
            return "count='{-count-}' page='{-page-}'";
        }
    };

    if(Entity.isEntity(entity)){
        generateQueryTemplate();
    }else{
        throw new NotEntityException("The constructor parameter is not an Entity");
    }

    function generateQueryTemplate(){
        queryTemplate = `<fetch distinct="true" mapping="logical" output-format="xml-platform" version="1.0" {-page/count-}>
                                <entity name="${entity.EntityName}">
                                    ${AttributesForRetrieveGenerator.generateRetrievalAttributesQueryForEntity(entity)}
                                    {-linkEntity-}
                                    {-filter-}
                                </entity>
                            </fetch>`;
    }

    this.getQuery = function(){
        if(this.RetrievedRecords.count > 0 && this.RetrievedRecords.pages >= 1){
            let retrievedRecordsTemplate = TemplatePlaceHolderMapper.mapTemplatePlaceHolderWithValue(this.RetrievedRecords.getTemplatePlaceHolder(), `{-count-}`, this.RetrievedRecords.count); 
            retrievedRecordsTemplate = TemplatePlaceHolderMapper.mapTemplatePlaceHolderWithValue(retrievedRecordsTemplate, `{-page-}`, this.RetrievedRecords.page);
            
            queryTemplate = TemplatePlaceHolderMapper.mapTemplatePlaceHolderWithValue(queryTemplate, `{-page/count-}`, retrievedRecordsTemplate);
        }
        
        queryTemplate = TemplatePlaceholderCleaner.removePlaceholdersFromTemplate(queryTemplate);
        return queryTemplate;
    }

    //This method is used for Template Pattern (QueryGeneratorTagIncluder)
    this.includeTagInTemplate = function(tag){
        let tagQuery = `${tag}\n${tag.PlaceHolder}`;
        queryTemplate = TemplatePlaceHolderMapper.mapTemplatePlaceHolderWithValue(queryTemplate, `${tag.PlaceHolder}`, tagQuery); 
    }
    //
}
QueryGenerator.prototype = new QueryGeneratorTagIncluder();
QueryGenerator.prototype.constructor = QueryGenerator;
//#endregion QueryGenerator



//#region Entity classes
    function Entity(entityName) { 
        this.EntityName = entityName;
        this.EntityId = "";
        this.ParentAttribute = { name: "", value: ""};
        this.Attributes = new Array();
        this.AllAttributes = false;
    }
    Entity.isEntity = function(entity){
        return (entity instanceof Entity);
    }

    function LinkEntity(entityName){
        Entity.call(this, entityName);

        this.ToAttribute = "";
        this.FromAttribute = "";
    }
    LinkEntity.prototype = new Entity();
    LinkEntity.prototype.constructor = LinkEntity;
//#endregion Entity classes



//#region AttributesForRetrieveQuerySyntaxGenerator
    var AttributesForRetrieveGenerator = function(){
        let generateRetrievalAttributesQueryForEntity = function(entity){
            
            let attributesQueryString = "";

            if(checkIfThereAreAnyAttributes(entity.Attributes)){
                entity.Attributes.forEach(function(attribute){
                    attributesQueryString += `<attribute name="${attribute}"/>`;
                });
            }else if(entity.AllAttributes){
                attributesQueryString = "<all-attributes/>";
            }else{
                attributesQueryString = "";
            }

            return attributesQueryString;
        }

        function checkIfThereAreAnyAttributes(attributes){
            return attributes.length != 0;
        }

        return{
            generateRetrievalAttributesQueryForEntity: generateRetrievalAttributesQueryForEntity
        }
    }();
//#endregion AttributesForRetrieveQuerySyntaxGenerator



//#region TemplatePlaceHolderCleaner
    var TemplatePlaceholderCleaner = (function(){

        let removePlaceholdersFromTemplate = function(template){
            let placeholderRegExp = /{-[\S\s].*-}/g;
            let placeholder;
            
            if((placeholder = placeholderRegExp.exec(template)) != null){
                let templateWithRemovedPlaceHolder = TemplatePlaceHolderMapper.mapTemplatePlaceHolderWithValue(template, placeholder[0], "");
                return removePlaceholdersFromTemplate(templateWithRemovedPlaceHolder);
            }else{
                return template;
            }
        }

        return{
            removePlaceholdersFromTemplate: removePlaceholdersFromTemplate
        }
    })();
//#endregion TemplatePlaceHolderCleaner



//#region TemplatePlaceHolderMapper
    var TemplatePlaceHolderMapper = (function(){

        let mapTemplatePlaceHolderWithValue = function(template, placeHolder, valueForMapping){
            let placeHolderRegExp = new RegExp(placeHolder);

            template = template.replace(placeHolderRegExp, valueForMapping);
            return template;
        }

        return{
            mapTemplatePlaceHolderWithValue: mapTemplatePlaceHolderWithValue
        }
    })();
//#endregion TemplatePlaceHolderMapper



//region QueryGeneratorTagIncluder
    function QueryGeneratorTagIncluder(){ }

    QueryGeneratorTagIncluder.prototype.addFilterTag = function(filterTag){
        if(FilterTag.isFilter(filterTag)){
            this.includeTagInTemplate(filterTag);
        }else{
            throw new NotFilterTagException("Given parameter is not an instanceof Filter");
        }
    }

    QueryGeneratorTagIncluder.prototype.addLinkEntityTag = function(linkEntityTag){
        if(LinkEntityTag.isLinkEntityTag(linkEntityTag)){
            this.includeTagInTemplate(linkEntityTag);
        }else{
            throw new NotLinkEntityTagException("Given parameter is not instanceof LinkEntityTag");
        }
    }
//#endregion QueryGeneratorTagIncluder



//#region FilterTag
    function FilterTag(type){ 

        this.PlaceHolder = "{-filter-}";
        let filterTemplate = "";
        
        if(checkForValidFilterTagType(type)){
            generateFilterTagForType(type);
        }else{
            throw new InCorrectFilterTypeException("Filter type is incorrect");
        }

        function checkForValidFilterTagType(type){
            return (type === "and" || type === "or");
        }

        function generateFilterTagForType(){
            filterTemplate = `<filter type="${type}">\n
                                    {-filter-}\n
                                    {-condition-}\n
                                    {-linkEntity-}\n
                                </filter>`
        }

        this.addConditionTag = function(conditionTag){
            if(ConditionInitializator.isCondition(conditionTag)){
                this.includeTagInTemplate(conditionTag);
            }else{
                throw new NotConditionTagException("Given parameter is not instanceof Condition");
            }
        }

        //This method is used for Template Pattern (QueryGeneratorTagIncluder)
        this.includeTagInTemplate = function(tag){
            let tagQuery = `${tag}\n${tag.PlaceHolder}`;
            filterTemplate = TemplatePlaceHolderMapper.mapTemplatePlaceHolderWithValue(filterTemplate, `${tag.PlaceHolder}`, tagQuery); 
        }
        //

        this.toString = function(){
            return filterTemplate;
        }
    }
    FilterTag.prototype = new QueryGeneratorTagIncluder();
    FilterTag.prototype.constructor = FilterTag;

    FilterTag.isFilter = function(filterTag){
        return (filterTag instanceof FilterTag);
    }
//#endregion FilterTag



//#region LinkEntityTag
    function LinkEntityTag(linkEntity){

        this.PlaceHolder = "{-linkEntity-}";
        let linkEntityTagTemplate = "";

        if(Entity.isEntity(linkEntity)){
            generateLinkEntityTemplate();
        }else{
            throw new NotEntityException("Given constructor parameter is not instanceof LinkEntity");
        }

        function generateLinkEntityTemplate(){
            linkEntityTagTemplate = `<link-entity name="${linkEntity.EntityName}" {-from-} {-to-}>
                        ${AttributesForRetrieveGenerator.generateRetrievalAttributesQueryForEntity(linkEntity)}
                        {-linkEntity-}\n
                        {-filter-}                                        
                    </link-entity>`;
            
            mapFromAttributeToTemplate();
            mapToAttributeToTemplate();
        }

        function mapFromAttributeToTemplate(){
            if(checkForDirectionalAttribute(linkEntity.FromAttribute)){
                let from = `from="${linkEntity.FromAttribute}"`;
                linkEntityTagTemplate = TemplatePlaceHolderMapper.mapTemplatePlaceHolderWithValue(linkEntityTagTemplate, "{-from-}", from);
            }
        }

        function mapToAttributeToTemplate(){
            if(checkForDirectionalAttribute(linkEntity.ToAttribute)){
                let to = `to="${linkEntity.ToAttribute}"`;
                linkEntityTagTemplate = TemplatePlaceHolderMapper.mapTemplatePlaceHolderWithValue(linkEntityTagTemplate, "{-to-}", to);
            }
        }
        
        function checkForDirectionalAttribute(direcrionalAttribute){
            return typeof direcrionalAttribute !== 'undefined';
        }

        //This method is used for Template Pattern (QueryGeneratorTagIncluder)
        this.includeTagInTemplate = function(tag){
            let tagQuery = `${tag}\n${tag.PlaceHolder}`;
            linkEntityTagTemplate = TemplatePlaceHolderMapper.mapTemplatePlaceHolderWithValue(linkEntityTagTemplate, `${tag.PlaceHolder}`, tagQuery); 
        }
        //

        this.toString = function(){
            return linkEntityTagTemplate;
        }
    }
    LinkEntityTag.prototype = new QueryGeneratorTagIncluder();
    LinkEntityTag.prototype.constructor = LinkEntityTag;

    LinkEntityTag.isLinkEntityTag = function(linkEntityTag){
        return (linkEntityTag instanceof LinkEntityTag);
    }
//#endregion LinkEntityTag



//#region Exceptions
    function NotEntityException(exceptionMessage){
        this.name = "NotEntityException";
        this.message = exceptionMessage;
        this.stack = (new Error()).stack;
    }

    NotEntityException.prototype = Object.create(Error.prototype);
    NotEntityException.prototype.constructor = NotEntityException;

    function InCorrectFilterTypeException(exceptionMessage){
        this.name = "InCorrectFilterTypeException";
        this.massage = exceptionMessage;
        this.stack = (new Error()).stack;
    }

    InCorrectFilterTypeException.prototype = Object.create(Error.prototype);
    InCorrectFilterTypeException.prototype.constructor = InCorrectFilterTypeException;

    function NotConditionTagException(exceptionMessage){
        this.name = "NotConditionTagException";
        this.massage = exceptionMessage;
        this.stack = (new Error()).stack;
    }

    NotConditionTagException.prototype = Object.create(Error.prototype)
    NotConditionTagException.prototype.constructor = NotConditionTagException;

    function NotFilterTagException(exceptionMessage){
        this.name = "NotFilterTagException";
        this.massage = exceptionMessage;
        this.stack = (new Error()).stack;
    }

    NotFilterTagException.prototype = Object.create(Error.prototype);
    NotFilterTagException.prototype.constructor = NotFilterTagException;

    function NotLinkEntityTagException(exceptionMessage){
        this.name = "NotLinkEntityTagException";
        this.massage = exceptionMessage;
        this.stack = (new Error()).stack;
    }

    NotLinkEntityTagException.prototype = Object.create(Error.prototype);
    NotLinkEntityTagException.prototype.constructor = NotLinkEntityTagException;
//#endregion Exceptions



//#region Conditions
    function ConditionInitializator(conditionForInitialization){

        conditionForInitialization = conditionForInitialization || {};
        conditionForInitialization.conditionTemplate = `<condition {-attribute-} {-operator-} {-value-}/>`;

        conditionForInitialization.setAttribute = function(attribute){
            mapConditionPlaceHolderWithValue("{-attribute-}", attribute);
        }

        conditionForInitialization.setOperator = function(operator){
            mapConditionPlaceHolderWithValue("{-operator-}", operator);
        }

        conditionForInitialization.setValue = function(value){
            mapConditionPlaceHolderWithValue("{-value-}", value);
        }

        function mapConditionPlaceHolderWithValue(placeHolder, value){
            conditionForInitialization.conditionTemplate = TemplatePlaceHolderMapper.mapTemplatePlaceHolderWithValue(conditionForInitialization.conditionTemplate, placeHolder, value);
        }
    }
    ConditionInitializator.isCondition = function(condition){
        return (condition.__proto__ === ConditionInitializator);
    }

    function NullCondition(attributeName){

        this.PlaceHolder = "{-condition-}";

        let nullCondition = {};
        ConditionInitializator(nullCondition);

        let operator = `operator="null"`;
        let attribute = `attribute="${attributeName}"`;
        let attributeValue = "";

        nullCondition.setOperator(operator);
        nullCondition.setAttribute(attribute);
        nullCondition.setValue(attributeValue);

        this.toString = function(){
            return nullCondition.conditionTemplate;
        }
    }
    NullCondition.prototype = ConditionInitializator;
    NullCondition.prototype.constructor = NullCondition;

    function EqualCondition(attributeName, value){

        this.PlaceHolder = "{-condition-}";

        let equalCondition = {};
        ConditionInitializator(equalCondition);

        let operator = `operator="eq"`;
        let attribute = `attribute="${attributeName}"`;
        let attributeValue = `value="${value}"`;

        equalCondition.setOperator(operator);
        equalCondition.setAttribute(attribute);
        equalCondition.setValue(attributeValue);

        this.toString = function(){
            return equalCondition.conditionTemplate;
        }
        
    }
    EqualCondition.prototype = ConditionInitializator;
    EqualCondition.prototype.constructor = EqualCondition;
//#endregion Conditions



//#region QueryGenerator.Helpers
    QueryGenerator.Helpers = (function(){

        let getQueryForChildFilteredByItsParentEntity = function(entity){
            checkIfInstanceOfEntity(entity);
            
            let query = buildEntityQueryWithCondition(entity, function(){
                return new EqualCondition(entity.ParentAttribute.name, entity.ParentAttribute.value);
            });

            return query;
        }

        let getEmptyQueryForEntity = function(entity){
            checkIfInstanceOfEntity(entity);

            let query = buildEntityQueryWithCondition(entity, function(){
                return new NullCondition(`${entity.EntityName}id`);
            });

            return query;
        }

        let checkIfInstanceOfEntity = function(entity){
            if(Entity.isEntity(entity) === false){
                throw new NotEntityException("Given parameters to the function are not instances of Entity");
            }
        }

        let buildEntityQueryWithCondition = function(entity, createConditionCallback){
            let queryGenerator = new QueryGenerator(entity);
            let condition = createConditionCallback();
            
            let filter = new FilterTag("and");
            filter.addConditionTag(condition);

            queryGenerator.addFilterTag(filter);
            return queryGenerator.getQuery();
        }

        return{
            getQueryForChildFilteredByItsParentEntity: getQueryForChildFilteredByItsParentEntity,
            getEmptyQueryForEntity: getEmptyQueryForEntity
        }
    })();
//#endregion QueryGenerator.Helpers