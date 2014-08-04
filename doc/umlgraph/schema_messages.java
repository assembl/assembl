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
/*class IdeaLink extends Idea {
    public List<Idea> components;
}*/


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
* @assoc * - 1 Discussion
*/
abstract class Content {
	public URI id;
	public DateTime creation_date;
	
}

class AgentProfile {
  public String display_name;
  public URI avatar_url;
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
