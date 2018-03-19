describe("QueryGenerator", function(){
    var childEntity, linkEntity;
    function generateExpectedQueryFromQueryBorder(){ }
    function compareActualQueryToGeneratedFromQueryBodyExpectedQuery(){ }
        
    beforeEach(function(){
        childEntity =  new Entity();
        
        childEntity.ParentAttributeName = "new_product";
        childEntity.EntityName = "product";
        childEntity.Attributes.push("name");
        childEntity.Attributes.push("productid");

        linkEntity = new LinkEntity();
        linkEntity.EntityName = "quotedetail";
        linkEntity.Attributes.push("quotedetailid");
        linkEntity.FromAttribute = "productid";
        linkEntity.ToAttribute = "productid";

        let expectedQuery;

        compareActualQueryToGeneratedFromQueryBodyExpectedQuery = function(actualQuery, expectedQueryBody){
            generateExpectedQueryFromQueryBorder(expectedQueryBody);

            expectedQuery = expectedQuery.replace(/ /g, "");
            expectedQuery = expectedQuery.replace(/\n/g, "");

            actualQuery = actualQuery.replace(/ /g, "");
            actualQuery = actualQuery.replace(/\n/g, "");

            expect(expectedQuery).toEqual(actualQuery);
        }

        generateExpectedQueryFromQueryBorder = function(expectedQueryBody){
            expectedQuery = `<fetch distinct="true" mapping="logical" output-format="xml-platform" version="1.0">
                                            <entity name="product"> 
                                                <attribute name="name"/>  
                                                <attribute name="productid"/>
                                                ${expectedQueryBody}
                                            </entity>
                                        </fetch>`;
        }
    });

    it("should generate a NotEntityException exception when constructor parameter is not an Entity", function(){
         expect(function(){
                    let query = new QueryGenerator("Hello World");
                }).toThrow(new NotEntityException("The constructor parameter is not an Entity"));
    });

    it("shoud add filter and return a query with filter", function(){

        let template = new QueryGenerator(childEntity);
        let filter = new FilterTag("and");
        template.addFilterTag(filter);

        compareActualQueryToGeneratedFromQueryBodyExpectedQuery(
            template.getQuery(), 
            `<filter type="and">
            </filter>`
        );
    });

    it("should add null condition and return a query with condition", function(){
        let condition = new NullCondition("quoteid");
        let template = new QueryGenerator(childEntity);
        let filter = new FilterTag("and");
        filter.addConditionTag(condition);

        template.addFilterTag(filter);
        
        compareActualQueryToGeneratedFromQueryBodyExpectedQuery(
            template.getQuery(),
            `<filter type="and">
                <condition attribute="quoteid" operator="null"/>
            </filter>`
        ); 
    });

    it("should add equal condition and return a query with condition", function(){
        let condition = new EqualCondition("productid", "020ae330-bc83-e711-80e2-3863bb35afd0");
        let template = new QueryGenerator(childEntity);
        let filter = new FilterTag("and");
        filter.addConditionTag(condition);
        template.addFilterTag(filter);

        compareActualQueryToGeneratedFromQueryBodyExpectedQuery(
            template.getQuery(),
            `<filter type="and">
                <condition attribute="productid" operator="eq" value="020ae330-bc83-e711-80e2-3863bb35afd0"/>
            </filter>` 
        );
    });

    it("should add link entity", function(){
        let template = new QueryGenerator(childEntity);
        let linkEntityTag = new LinkEntityTag(linkEntity);
        template.addLinkEntityTag(linkEntityTag);

        compareActualQueryToGeneratedFromQueryBodyExpectedQuery(
            template.getQuery(),
            `<link-entity name="quotedetail" from="productid" to="productid">
                <attribute name="quotedetailid"/>  
            </link-entity>`
        );
    });

    describe("QueryGeneratorHelpers", function(){

        describe("getQueryForChildFilteredByItslinkEntity", function(){
            it("should return a query with child attributes, (child) filtered by it's parent", function(){
                let product = new Entity("product");
                product.ParentAttribute.name = "new_product";
                product.ParentAttribute.value = "020ae330-bc83-e711-80e2-3863bb35afd0";
                product.Attributes.push("name");
                product.Attributes.push("productid");

                compareActualQueryToGeneratedFromQueryBodyExpectedQuery(
                    QueryGenerator.Helpers.getQueryForChildFilteredByItsParentEntity(product),
                    `<filter type="and">
                        <condition attribute="new_product" operator="eq" value="020ae330-bc83-e711-80e2-3863bb35afd0"/>
                    </filter>`
                );
            
            });
        });

        describe("getEmptyQueryFor", function(){
            it("should return a query which when has been executed, return zero records", function(){
            
                compareActualQueryToGeneratedFromQueryBodyExpectedQuery(
                     QueryGenerator.Helpers.getEmptyQueryForEntity(childEntity),
                     `<filter type="and">
                        <condition attribute="productid" operator="null"/>
                    </filter>`
                );
            
            });
        });
    });

    describe("NestedFunctionality", function(){
        describe("FilterTag", function(){
            it("should return a query with nested filter", function(){
                let queryGenerator = new QueryGenerator(childEntity);
                let parentFilter = new FilterTag("and");
                let nestedFilter = new FilterTag("or");
                parentFilter.addFilterTag(nestedFilter);
                queryGenerator.addFilterTag(parentFilter);

                compareActualQueryToGeneratedFromQueryBodyExpectedQuery(
                    queryGenerator.getQuery(),
                    `<filter type="and">
                        <filter type="or">
                        </filter>
                    </filter>`
                );
            });

            it("should throw an InCorrectFilterTypeException when filter type is different from and/or", function(){
                expect(function(){
                    let filter = new FilterTag("Something else...");
                }).toThrow(new InCorrectFilterTypeException("Filter type is incorrect"));
            });

            it("should return a query with nested - filter with null condition", function(){
                let queryGenerator = new QueryGenerator(childEntity);
                let parentFilter = new FilterTag("and");
                let nestedFilter = new FilterTag("or");
                let nullCondition = new NullCondition("quoteid");
                nestedFilter.addConditionTag(nullCondition);
                parentFilter.addFilterTag(nestedFilter);
                queryGenerator.addFilterTag(parentFilter);
                
                compareActualQueryToGeneratedFromQueryBodyExpectedQuery(
                    queryGenerator.getQuery(),
                    `<filter type="and">
                        <filter type="or">
                            <condition attribute="quoteid" operator="null"/>
                        </filter>
                    </filter>`
                );
            });

            it("should throw an NotFilterTagException when adding filter, which it not instanceof Filter", function(){
                expect(function(){
                    let filter = new FilterTag("and");
                    filter.addFilterTag("Incorrect Filter");
                }).toThrow(new NotFilterTagException("Given parameter is not instanceof Filter"));
            });

            it("should throw an NotConditionTagException when adding condition, which it not instanceof Condition", function(){
                 expect(function(){
                    let filter = new FilterTag("or");
                    filter.addConditionTag("InCorrect Condition");
                 }).toThrow(new NotConditionTagException ("Given parameter is not instanceof Condition"));
            });

            

            it("should return a query with nested linked entity in filter", function(){
                let queryGenerator = new QueryGenerator(childEntity);
                let filter = new FilterTag("and");
                let linkEntityTag = new LinkEntityTag(linkEntity);
                filter.addLinkEntityTag(linkEntityTag);
                queryGenerator.addFilterTag(filter);

                compareActualQueryToGeneratedFromQueryBodyExpectedQuery(
                    queryGenerator.getQuery(),
                    `<filter type="and">
                        <link-entity name="quotedetail" from="productid" to="productid">
                            <attribute name="quotedetailid"/>
                        </link-entity>
                    </filter>`
                );
            });
        });
        describe("LinkEntityTag", function(){
            it("should return a query with nested linkTags", function(){
                let queryGenerator = new QueryGenerator(childEntity);
                
                let parentLinkEntity = new LinkEntity();
                parentLinkEntity.EntityName = "quote";
                parentLinkEntity.FromAttribute = "quoteid";
                parentLinkEntity.ToAttribute = "quoteid";

                let childLinkEntityTag = new LinkEntityTag(linkEntity);
                let parentLinkEntityTag = new LinkEntityTag(parentLinkEntity);
                childLinkEntityTag.addLinkEntityTag(parentLinkEntityTag);
                queryGenerator.addLinkEntityTag(childLinkEntityTag);
                
                compareActualQueryToGeneratedFromQueryBodyExpectedQuery(
                    queryGenerator.getQuery(),
                    `<link-entity name="quotedetail" from="productid" to="productid">
                        <attribute name="quotedetailid"/>
                        <link-entity name="quote" from="quoteid" to="quoteid">
                        </link-entity>
                    </link-entity>`
                );
            });
            
            it("should throw an NonLinkEntityTagException when parameter to addLinkEntityTag is not instanceof a LinkEntityTag", function(){
                expect(function(){
                    let linkEntityTag = new LinkEntityTag(linkEntity);
                    linkEntityTag.addLinkEntityTag("Something else");
                }).toThrow(new NotLinkEntityTagException("Given parameter is not an instanceof LinkEntityTag"));
            });

            it("should return a query with nested FilterTag in LinkEntityTag", function(){
                let queryGenerator = new QueryGenerator(childEntity);
                let filter = new FilterTag("and");
                let linkEntityTag = new LinkEntityTag(linkEntity);
                linkEntityTag.addFilterTag(filter);
                queryGenerator.addLinkEntityTag(linkEntityTag);

                compareActualQueryToGeneratedFromQueryBodyExpectedQuery(
                    queryGenerator.getQuery(),
                    `<link-entity name="quotedetail" from="productid" to="productid">
                        <attribute name="quotedetailid"/>
                        <filter type="and">
                        </filter>
                    </link-entity>`
                );
            });

            it("should throw a NotFilterTagException when parameter to addFilterTag is not an instanceof FilterTag", function(){
                expect(function(){
                    let linkEntityTag = new LinkEntityTag(linkEntity);
                    linkEntityTag.addFilterTag("In correct FilterTag");
                }).toThrow(new NotFilterTagException("Given parameter is not an instanceof FilterTag"));
            });
        });
    });
});