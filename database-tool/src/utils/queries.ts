export class Queries {
  async getDDLQuery(schemaName: string | null = 'dbo'): Promise<string> {
    return await `
        CREATE PROCEDURE [sp_getddl] @TBL VARCHAR(255) 
AS 
  BEGIN 
      SET nocount ON 
      DECLARE @TBLNAME            VARCHAR(200), 
              @SCHEMANAME         VARCHAR(255), 
              @STRINGLEN          INT, 
              @TABLE_ID           INT, 
              @FINALSQL           VARCHAR(max), 
              @CONSTRAINTSQLS     VARCHAR(max), 
              @CHECKCONSTSQLS     VARCHAR(max), 
              @RULESCONSTSQLS     VARCHAR(max), 
              @FKSQLS             VARCHAR(max), 
              @TRIGGERSTATEMENT   VARCHAR(max), 
              @EXTENDEDPROPERTIES VARCHAR(max), 
              @INDEXSQLS          VARCHAR(max), 
              @vbCrLf             CHAR(2) 
      SET @vbCrLf = Char(13) + Char(10) 
      SELECT @SCHEMANAME = Isnull(Parsename(@TBL, 2), '${schemaName}'), 
             @TBLNAME = Parsename(@TBL, 1) 
      SELECT @TABLE_ID = [object_id] 
      FROM   sys.objects 
      WHERE  [type] = 'U' 
             AND [name] <> 'dtproperties' 
             AND [name] = @TBLNAME 
             AND [schema_id] = Schema_id(@SCHEMANAME); 
      IF Isnull(@TABLE_ID, 0) = 0 
        BEGIN 
            SET @FINALSQL = 'Table object [' + @SCHEMANAME + '].[' 
                            +  (@TBLNAME) 
                            + '] does not exist in Database [' 
                            + Db_name() + ']' 
            SELECT @FINALSQL; 
            RETURN 0 
        END 
      SELECT @FINALSQL = 'CREATE TABLE [' + @SCHEMANAME + '].[' 
                         +  (@TBLNAME) + '] ( ' 
      SELECT @TABLE_ID = Object_id(@TBLNAME) 
      SELECT @STRINGLEN = Max(Len(sys.columns.[name])) + 1 
      FROM   sys.objects 
             INNER JOIN sys.columns 
                     ON sys.objects.[object_id] = sys.columns.[object_id] 
                        AND sys.objects.[object_id] = @TABLE_ID; 
      SELECT @FINALSQL = @FINALSQL + CASE WHEN sys.columns.[is_computed] = 1 
                         THEN 
                         @vbCrLf + 
                                '[' +  ( 
                                sys.columns.[name]) + '] ' + Space(@STRINGLEN - 
                                Len(sys.columns.[name])) + 'AS ' + 
                                Isnull(CALC.definition, '') ELSE 
                                @vbCrLf + '[' +  (sys.columns.[name]) + '] ' 
                         + 
                         Space( 
                                @STRINGLEN - Len(sys.columns.[name])) + 
                                 (Type_name(sys.columns.[user_type_id])) + 
                         CASE 
                         WHEN 
                                Type_name(sys.columns.[user_type_id]) IN ( 
                         'decimal', 
                                'numeric') THEN '(' + CONVERT( 
                                VARCHAR, sys.columns.[precision]) + ',' + 
                         CONVERT( 
                         VARCHAR, 
                                sys.columns.[scale]) + ') ' + Space(6 - Len( 
                         CONVERT( 
                         VARCHAR, 
                                sys.columns.[precision]) + ',' + 
                                CONVERT(VARCHAR, sys.columns.[scale]))) + Space( 
                         2) 
                          -- + SPACE(16 - LEN(TYPE_NAME(sys.columns.[user_type_id])))  
                         + CASE WHEN Columnproperty ( @TABLE_ID, 
                         sys.columns.[name], 
                                'IsIdentity' ) = 0 THEN '              ' ELSE 
                         ' IDENTITY(' + 
                                CONVERT(VARCHAR, Isnull(Ident_seed(@TBLNAME), 1) 
                         ) 
                         + 
                         ',' + 
                                CONVERT(VARCHAR, Isnull(Ident_incr(@TBLNAME), 1) 
                         ) 
                         + 
                         ')' END 
                                + CASE WHEN sys.columns.[is_nullable] = 0 THEN 
                         ' NOT NULL' 
                                ELSE '     NULL' END WHEN 
                                Type_name(sys.columns.[user_type_id]) IN ( 
                         'float', 
                         'real') 
                                THEN CASE WHEN 
                                sys.columns.[precision] = 53 THEN Space(11 - 
                                Len(CONVERT(VARCHAR, sys.columns.[precision]))) 
                         + 
                         Space(7) + 
                                Space(16 - 
                                Len(Type_name(sys.columns.[user_type_id]))) + 
                         CASE 
                         WHEN 
                                sys.columns.[is_nullable] = 0 THEN 
                                ' NOT NULL' ELSE '     NULL' END ELSE '(' + 
                         CONVERT( 
                         VARCHAR, 
                                sys.columns.[precision]) + ') ' + Space(6 - Len( 
                         CONVERT( 
                                VARCHAR, sys.columns.[precision]))) + Space(7) + 
                         Space 
                         (16 
                                - Len(Type_name(sys.columns.[user_type_id]))) + 
                         CASE 
                         WHEN 
                                sys.columns.[is_nullable] = 0 THEN ' NOT NULL' 
                         ELSE 
                                '     NULL' END 
                                END WHEN Type_name(sys.columns.[user_type_id]) 
                         IN 
                         ( 
                         'char', 
                                'varchar') THEN CASE WHEN 
                         sys.columns.[max_length] = -1
                         THEN 
                                '(max)' + Space(6 - Len(CONVERT(VARCHAR, sys.columns.[max_length]))) 
                         + 
                         Space(7) + 
                                Space(16 - 
                                Len(Type_name(sys.columns.[user_type_id]))) + 
                         CASE 
                         WHEN 
                                sys.columns.collation_name IS NULL THEN '' 
                                ELSE ' COLLATE ' + sys.columns.collation_name 
                         END 
                         + 
                         CASE WHEN 
                                sys.columns.[is_nullable] = 0 THEN ' NOT NULL' 
                         ELSE 
                                '     NULL' END ELSE '(' + 
                                CONVERT(VARCHAR, sys.columns.[max_length]) + 
                         ') ' 
                         + 
                         Space(6 - 
                                Len(CONVERT(VARCHAR, sys.columns.[max_length]))) 
                         + 
                         Space(7) + 
                                Space(16 - 
                                Len(Type_name(sys.columns.[user_type_id]))) + 
                         CASE 
                         WHEN 
                                sys.columns.collation_name IS NULL THEN '' 
                                ELSE ' COLLATE ' + sys.columns.collation_name 
                         END 
                         + 
                         CASE WHEN 
                                sys.columns.[is_nullable] = 0 THEN ' NOT NULL' 
                         ELSE 
                                '     NULL' END END WHEN 
                                Type_name(sys.columns.[user_type_id]) IN ( 
                         'nchar', 
                         'nvarchar' 
                                ) THEN CASE WHEN 
                                sys.columns.[max_length] = -1 THEN '(max)' + 
                         Space 
                         (6 - 
Len(CONVERT(VARCHAR, (sys.columns.[max_length])))) 
+ 
Space(7) 
+ Space(16 - Len(Type_name( 
sys.columns.[user_type_id]))) + CASE WHEN 
sys.columns.collation_name IS NULL THEN '' ELSE 
' COLLATE ' + 
sys.columns.collation_name END + CASE WHEN 
sys.columns.[is_nullable] = 0 THEN 
' NOT NULL' ELSE '     NULL' END ELSE '(' + 
CONVERT( 
VARCHAR, 
(sys.columns.[max_length])) + ') ' + Space(6 - Len 
( 
CONVERT( 
VARCHAR, (sys.columns.[max_length])))) + Space(7) 
+ 
Space(16 
- Len(Type_name(sys.columns.[user_type_id]))) + 
CASE 
WHEN 
sys.columns.collation_name IS NOT NULL THEN '' 
ELSE 
' COLLATE ' + 
sys.columns.collation_name END + CASE WHEN 
sys.columns.[is_nullable] 
= 0 THEN ' NOT NULL' ELSE '     NULL' END END WHEN 
Type_name( 
sys.columns.[user_type_id]) IN ('datetime', 
'money', 
'text', 
'image') THEN Space(18 - 
Len(Type_name(sys.columns.[user_type_id]))) + 
'              ' + CASE WHEN 
sys.columns.[is_nullable] = 0 THEN ' NOT NULL' 
ELSE 
'     NULL' END ELSE Space(16 
- Len(Type_name(sys.columns.[user_type_id]))) + 
CASE 
WHEN 
Columnproperty ( @TABLE_ID, sys.columns.[name], 
'IsIdentity' 
) = 0 THEN '              ' ELSE ' IDENTITY(' + 
CONVERT( 
VARCHAR, Isnull(Ident_seed(@TBLNAME), 1) ) + ',' + 
CONVERT( 
VARCHAR, Isnull(Ident_incr(@TBLNAME), 1) ) + ')' 
END + 
Space( 
2) + CASE WHEN sys.columns.[is_nullable] = 0 THEN 
' NOT NULL' 
ELSE '     NULL' END END + CASE WHEN 
sys.columns.[default_object_id] = 0 THEN '' 
--ELSE ' DEFAULT '  + ISNULL(def.[definition] ,'')    
--optional section in case NAMED default cosntraints are needed:   
ELSE @vbCrLf + 'CONSTRAINT [' + def.NAME + '] DEFAULT ' + 
Isnull(def.[definition], '') 
--i thought it needed to be handled differently! NOT!         
END --CASE cdefault       
END --iscomputed         
+ ',' 
FROM   sys.columns 
LEFT OUTER JOIN sys.default_constraints DEF 
ON sys.columns.[default_object_id] = DEF.[object_id] 
LEFT OUTER JOIN sys.computed_columns CALC 
ON sys.columns.[object_id] = CALC.[object_id] 
AND sys.columns.[column_id] = CALC.[column_id] 
WHERE  sys.columns.[object_id] = @TABLE_ID 
ORDER  BY sys.columns.[column_id] 

SELECT @STRINGLEN = Max(Len([name])) + 1 
FROM   sys.objects 

DECLARE @Results TABLE 
( 
[schema_id]             INT, 
[schema_name]           VARCHAR(255), 
[object_id]             INT, 
[object_name]           VARCHAR(255), 
[index_id]              INT, 
[index_name]            VARCHAR(255), 
[rows]                  INT, 
[sizemb]                DECIMAL(19, 3), 
[indexdepth]            INT, 
[type]                  INT, 
[type_desc]             VARCHAR(30), 
[fill_factor]           INT, 
[is_unique]             INT, 
[is_primary_key]        INT, 
[is_unique_constraint]  INT, 
[index_columns_key]     VARCHAR(max), 
[index_columns_include] VARCHAR(max) 
) 

INSERT INTO @Results 
SELECT sys.schemas.schema_id, 
sys.schemas.[name] 
AS schema_name, 
sys.objects.[object_id], 
sys.objects.[name] 
AS object_name, 
sys.indexes.index_id, 
Isnull(sys.indexes.[name], '---') 
AS index_name, 
partitions.rows, 
partitions.sizemb, 
Indexproperty(sys.objects.[object_id], sys.indexes.[name], 
'IndexDepth') 
AS 
IndexDepth, 
sys.indexes.type, 
sys.indexes.type_desc, 
sys.indexes.fill_factor, 
sys.indexes.is_unique, 
sys.indexes.is_primary_key, 
sys.indexes.is_unique_constraint, 
Isnull(Index_Columns.index_columns_key, '---') 
AS index_columns_key, 
Isnull(Index_Columns.index_columns_include, '---') 
AS index_columns_include 
FROM   sys.objects 
JOIN sys.schemas 
ON sys.objects.schema_id = sys.schemas.schema_id 
JOIN sys.indexes 
ON sys.objects.[object_id] = sys.indexes.[object_id] 
JOIN (SELECT [object_id], 
index_id, 
Sum(row_count)                                        AS 
Rows, 
CONVERT(NUMERIC(19, 3), CONVERT(NUMERIC(19, 3), Sum( 
                  in_row_reserved_page_count 
                  + lob_reserved_page_count 
                  + 
                  row_overflow_reserved_page_count 
                  )) / 
                  CONVERT(NUMERIC(19, 3), 128)) AS 
SizeMB 
FROM   sys.dm_db_partition_stats 
GROUP  BY [object_id], 
index_id) AS partitions 
ON sys.indexes.[object_id] = partitions.[object_id] 
AND sys.indexes.index_id = partitions.index_id 
CROSS apply (SELECT LEFT(index_columns_key, 
 Len(index_columns_key) - 1) 
 AS 
index_columns_key 
, 
LEFT(index_columns_include, Len(index_columns_include) - 1) AS 
index_columns_include 
FROM   (SELECT (SELECT sys.columns.[name] + ',' + ' ' 
FROM   sys.index_columns 
JOIN sys.columns 
ON sys.index_columns.column_id = sys.columns.column_id 
AND sys.index_columns.[object_id] = 
sys.columns.[object_id] 
WHERE  sys.index_columns.is_included_column = 0 
AND sys.indexes.[object_id] = 
sys.index_columns.[object_id] 
AND sys.indexes.index_id = sys.index_columns.index_id 
ORDER  BY key_ordinal 
FOR xml path('')) AS index_columns_key, 
(SELECT sys.columns.[name] + ',' + ' ' 
FROM   sys.index_columns 
JOIN sys.columns 
ON sys.index_columns.column_id = sys.columns.column_id 
AND sys.index_columns.[object_id] = 
sys.columns.[object_id] 
WHERE  sys.index_columns.is_included_column = 1 
AND sys.indexes.[object_id] = 
sys.index_columns.[object_id] 
AND sys.indexes.index_id = sys.index_columns.index_id 
ORDER  BY index_column_id 
FOR xml path('')) AS index_columns_include) AS Index_Columns) AS 
Index_Columns 
WHERE  sys.schemas.[name] LIKE CASE 
       WHEN @SCHEMANAME = '' THEN 
       sys.schemas.[name] 
       ELSE @SCHEMANAME 
     END 
AND sys.objects.[name] LIKE CASE 
           WHEN @TBLNAME = '' THEN 
           sys.objects.[name] 
           ELSE @TBLNAME 
         END 
ORDER  BY sys.schemas.[name], 
sys.objects.[name], 
sys.indexes.[name] 

--@Results table has both PK,s Uniques and indexes in thme...pull them out for adding to funal results:    
SET @CONSTRAINTSQLS = '' 
SET @INDEXSQLS = '' 

SELECT @CONSTRAINTSQLS = @CONSTRAINTSQLS + CASE WHEN is_primary_key = 1 OR 
is_unique = 
      1 THEN @vbCrLf + 
      'CONSTRAINT   [' + index_name + '] ' + Space 
( 
@STRINGLEN 
      - Len(index_name)) + CASE WHEN 
is_primary_key = 
1 THEN 
      ' PRIMARY KEY ' ELSE CASE WHEN is_unique = 1 
THEN 
      ' UNIQUE      ' ELSE '' END END + type_desc 
+ 
CASE WHEN 
      type_desc='NONCLUSTERED' THEN '' ELSE '   ' 
END 
+ ' (' 
      + index_columns_key + ')' + CASE WHEN 
      index_columns_include <> '---' THEN 
' INCLUDE (' 
+ 
      index_columns_include + ')' ELSE '' END + 
CASE 
WHEN 
      fill_factor <> 0 THEN ' WITH FILLFACTOR = ' 
+ 
CONVERT( 
      VARCHAR(30), fill_factor) ELSE '' END ELSE 
'' 
END + ',' 
FROM   @RESULTS 
WHERE  [type_desc] != 'HEAP' 
AND is_primary_key = 1 
OR is_unique = 1 
ORDER  BY is_primary_key DESC, 
is_unique DESC 

SELECT @INDEXSQLS = @INDEXSQLS + CASE WHEN is_primary_key = 0 OR is_unique = 
0 THEN 
 @vbCrLf + 
 'CREATE INDEX [' + index_name + '] ' + Space( 
@STRINGLEN 
 - Len(index_name)) + ' ON [' + [object_name] + 
']' + 
' (' + 
 index_columns_key + ')' + CASE WHEN 
index_columns_include <> 
 '---' THEN ' INCLUDE (' + index_columns_include + 
')' 
ELSE 
 '' END + CASE WHEN fill_factor <> 0 THEN 
 ' WITH FILLFACTOR = ' + CONVERT(VARCHAR(30), 
fill_factor) 
 ELSE '' END END 
FROM   @RESULTS 
WHERE  [type_desc] != 'HEAP' 
AND is_primary_key = 0 
AND is_unique = 0 
ORDER  BY is_primary_key DESC, 
is_unique DESC 

IF @INDEXSQLS <> '' 
SET @INDEXSQLS = @vbCrLf + 'GO' + @vbCrLf + @INDEXSQLS 

SET @CHECKCONSTSQLS = '' 

SELECT @CHECKCONSTSQLS = @CHECKCONSTSQLS + @vbCrLf 
+ Isnull('CONSTRAINT   [' + sys.objects.[name] + 
'] ' + 
Space( 
      @STRINGLEN - Len(sys.objects.[name])) + 
' CHECK ' + 
      Isnull(sys.check_constraints.definition, '') 
+ 
',', '') 
FROM   sys.objects 
INNER JOIN sys.check_constraints 
ON sys.objects.[object_id] = 
sys.check_constraints.[object_id] 
WHERE  sys.objects.type = 'C' 
AND sys.objects.parent_object_id = @TABLE_ID 

SET @FKSQLS = ''; 

SELECT @FKSQLS = @FKSQLS + @vbCrLf + 'CONSTRAINT   [' 
+ Object_name(constid) + ']' 
+ Space(@STRINGLEN - Len(Object_name(constid) )) 
+ '  FOREIGN KEY (' + Col_name(fkeyid, fkey) 
+ ') REFERENCES ' + Object_name(rkeyid) + '(' 
+ Col_name(rkeyid, rkey) + '),' 
FROM   sysforeignkeys 
WHERE  fkeyid = @TABLE_ID 

SET @RULESCONSTSQLS = '' 

SELECT @RULESCONSTSQLS = @RULESCONSTSQLS 
+ Isnull( @vbCrLf + 
'if not exists(SELECT [name] FROM sys.objects WHERE TYPE=''R'' AND schema_id = ' 
+ CONVERT(VARCHAR(30), sys.objects.schema_id) + 
' AND [name] = ''[' + 
Object_name(sys.columns.[rule_object_id]) + ']'')' + 
@vbCrLf + 
sys.sql_modules.definition + @vbCrLf + 'GO' + @vbCrLf + 
'EXEC sp_binderule  [' 
+ sys.objects.[name] + '], ''[' + 
Object_name(sys.columns.[object_id]) + '].[' + 
sys.columns.[name] + 
']''' + @vbCrLf + 'GO', '') 
FROM   sys.columns 
INNER JOIN sys.objects 
ON sys.objects.[object_id] = sys.columns.[object_id] 
INNER JOIN sys.sql_modules 
ON sys.columns.[rule_object_id] = sys.sql_modules.[object_id] 
WHERE  sys.columns.[rule_object_id] <> 0 
AND sys.columns.[object_id] = @TABLE_ID 

SET @TRIGGERSTATEMENT = '' 

SELECT @TRIGGERSTATEMENT = @TRIGGERSTATEMENT + @vbCrLf 
 + sys.sql_modules.[definition] + @vbCrLf + 'GO' 
FROM   sys.sql_modules 
WHERE  [object_id] IN(SELECT [object_id] 
FROM   sys.objects 
WHERE  type = 'TR' 
   AND [parent_object_id] = @TABLE_ID) 

IF @TRIGGERSTATEMENT <> '' 
SET @TRIGGERSTATEMENT = @vbCrLf + 'GO' + @vbCrLf + @TRIGGERSTATEMENT 

SET @EXTENDEDPROPERTIES = '' 

SELECT @EXTENDEDPROPERTIES = @EXTENDEDPROPERTIES + @vbCrLf 
   + 'EXEC sys.sp_addextendedproperty           @name = N''' + [name] 
   + ''', @value = N''' 
   + Replace(CONVERT(VARCHAR(max), [value]), '''', 
   '''''') 
   + 
''',           @level0type = N''SCHEMA'', @level0name = [' 
   + @SCHEMANAME 
   + 
'],           @level1type = N''TABLE'', @level1name = [' 
   + @TBLNAME + '];' 
FROM   Fn_listextendedproperty (NULL, 'schema', @SCHEMANAME, 'table', 
@TBLNAME, NULL, 
NULL); 

IF @EXTENDEDPROPERTIES <> '' 
SET @EXTENDEDPROPERTIES = @vbCrLf + 'GO' + @vbCrLf + @EXTENDEDPROPERTIES 

SELECT @FINALSQL = @FINALSQL + @CONSTRAINTSQLS + @CHECKCONSTSQLS 
+ @FKSQLS 

SET @FINALSQL = Substring(@FINALSQL, 1, Len(@FINALSQL) - 1); 
SET @FINALSQL = @FINALSQL + ')' + @vbCrLf; 

SELECT @FINALSQL + @INDEXSQLS + @RULESCONSTSQLS 
+ @TRIGGERSTATEMENT + @EXTENDEDPROPERTIES 
END
`;
  }
}
