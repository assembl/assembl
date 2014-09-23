import java.util.List;
import java.util.Map;
import java.util.ArrayList;
import java.util.Arrays;

/**
 * @opt operations
 * @opt attributes
 * @opt types
 * @opt collpackages java.util.*
 * @opt hide java.*
 * @hidden
 */
class UMLOptions {}

/** @hidden */
class URL {}
/** @hidden */
class URI {}
/** @hidden */
class DateTime {}


/**
* 
*/
class Discussion {
//    public TOC toc;
}

/**
 * @has 1 - 1..* Idea
 */
class IdeaLink extends Idea {
    public List<Idea> components;
}


/**
 *  @assoc 1 - * Discussion
 */
abstract class ContentSource {
}
/**
 * 
 */
abstract class PostSource extends ContentSource {
  public DateTime last_import;
    public void import_content();
    public void reprocess_content();
    public void send_post(Post post);
}

/**
 * 
 */
class AnnotatorSource extends ContentSource {
}

/********************************  Begin synthesis.py *************************/

/**
 * @assoc * - 1 Discussion
 */
abstract class IdeaGraphView {
	public DateTime creation_date;
	
}

/**
 * @assoc * - 1 IdeaGraphView
 * @assoc 1 - 1 Idea
 */
class SubGraphIdeaAssociation {
	public DateTime creation_date;
	
}

/**
 * @assoc * - 1 IdeaGraphView
 * @assoc 1 - 1 IdeaLink
 */
class SubGraphIdeaLinkAssociation {
	public DateTime creation_date;
	
}

/**
 * 
 */
class ExplicitSubGraphView extends IdeaGraphView {
}

/**
 * 
 */
class TableOfContents extends IdeaGraphView {
}

/**
 * 
 */
class Synthesis extends ExplicitSubGraphView {
	public String subject;
	public String introduction;
	public String conclusion;
	public Boolean is_next_synthesis;
	public void publish();
}

/**
 * @assoc * - 1 Discussion
 */
class Idea {
	public String long_title;
	public String short_title;
	public String definition;
	public Boolean hidden;
	public DateTime creation_date;
}
/**
 * @assoc 1 - 1 Discussion
 */
class RootIdea extends Idea {
	
}

/** @hidden
 * 
 */
class Issue extends Idea {
	
}

/** @hidden
 * 
 */
class Position extends Idea {
	
}

/** @hidden
 * 
 */
class Argument extends Idea {
	
}

/** @hidden
 * 
 */
class Criterion extends Idea {
	
}

/**
 * @assoc * source 1 Idea 
 * @assoc * target 1 Idea 
 */
abstract class IdeaLink {
	public int order;
	public DateTime creation_date;
}


/** @hidden
 * 
 */
class PositionRespondsToIssue extends IdeaLink {
	
}


/** @hidden
 * 
 */
class ArgumentSupportsIdea extends IdeaLink {
	
}


/** @hidden
 * 
 */
class ArgumentOpposesIdea extends IdeaLink {
	
}


/** @hidden
 * 
 */
class IssueAppliesTo extends IdeaLink {
	
}

/** @hidden
 * 
 */
class IssueQuestions extends IssueAppliesTo {
	
}

/**
 *  * @assoc * - 1 Idea
 * @assoc * - 1 Content
 */
abstract class IdeaContentLink {
	public int order;
}

/**
 * 
 */
class IdeaContentWidgetLink extends IdeaContentLink  {
	
}

/**
 * 
 */
class IdeaContentPositiveLink extends IdeaContentLink  {
	
}

/**
 * 
 */
class IdeaRelatedPostLink extends IdeaContentPositiveLink {
	
}

/**
 * @assoc * - 1 Discussion
 * @assoc * owner 1 AgentProfile 
 */
class Extract extends IdeaContentPositiveLink {
	public String body;
}

/**
 * 
 */
abstract class IdeaContentNegativeLink extends IdeaContentLink  {
	
}

/**
 * 
 */
abstract class IdeaThreadContextBreakLink extends IdeaContentNegativeLink  {
	
}

/**
 * @assoc * - 1 Extract
 */
class TextFragmentIdentifier  {
	
}

/*********************************  End synthesis.py **************************/

/******************************  Begin annotation.py **************************/
/**
 * 
 */
abstract class Webpage extends Content  {
	
}
/********************************  End annotation.py **************************/


/******************************  Begin auth.py **************************/
/**
 * 
 */
class AgentProfile {
  public String display_name;
  public URI avatar_url;
}
/**
 *  @assoc * - 1 AgentProfile
 */
abstract class AbstractAgentAccount {
  public String display_name;
  public URI avatar_url;
}

/**
 * 
 */
class EmailAccount extends AbstractAgentAccount {
  public String email;
  public Boolean verified;
  public Boolean prefered;
  public Boolean active;
}

/**
 *  
 */
class IdentityProvider {
	public String provider_type;
	public String name;
	public Boolean trust_emails;
}

/**
 *  @assoc * provider 1 IdentityProvider
 */
abstract class IdentityProviderAccount  extends AbstractAgentAccount {
  public String display_name;
  public URI avatar_url;
}

/**
 *  
 */
class User extends AgentProfile {
	
}

/**
 *  @assoc 1 - 1 User
 */
class UserName {
	
}

//NOTE:  I didn't do the permission related classes yet...

/********************************  End auth.py **************************/
/**
* @assoc * - 1 Discussion
*/
abstract class Content {
	public URI id;
	public DateTime creation_date;
	
}


/**
 * @assoc * parent 1 Post
 * @assoc * creator 1 AgentProfile
 */
class Post extends Content {
    public String message_id;
    public Post parent;
}

/**
 * @assoc * - 1 PostSource
 */
abstract class ImportedPost extends Post{

}
class Email extends ImportedPost{

}

class AssemblPost extends Post {}

class IdeaProposalPost extends AssemblPost {}

/** @hidden */
class DynamicPost extends Post {}


/**
 */
class SynthesisPost extends AssemblPost {

}

class AbstractMailbox extends PostSource {
}

class IMAPMailbox extends AbstractMailbox {
}
class MailingList extends IMAPMailbox {
	
}
class AbstractFilesystemMailbox extends AbstractMailbox {
	
}
class MaildirMailbox extends AbstractFilesystemMailbox {
	
}
